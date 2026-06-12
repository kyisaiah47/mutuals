import { getSupabase, UserInterest, UserInsight, InsightItem } from "./supabase";

// Generate a unique user ID (in a real app, this would come from authentication)
export const generateUserId = () => {
	return "user_" + Math.random().toString(36).substr(2, 9);
};

// Check if a user ID is already taken
export const checkUserIdExists = async (userId: string) => {
	try {
		const { data, error } = await getSupabase()
			.from("user_profiles")
			.select("user_id")
			.eq("user_id", userId)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 is "not found" error, which is what we want
			throw error;
		}

		return { exists: !!data, error: null };
	} catch (error) {
		console.error("Error checking user ID:", error);
		return { exists: false, error };
	}
};

// Save user profile with interests and insights
export const saveUserProfile = async (
	userId: string,
	interests: Record<string, string[]>,
	insights: Record<string, InsightItem[]>,
	contact?: string,
	avatar?: string
) => {
	try {
		// First, save the main profile
		const { data: profile, error: profileError } = await getSupabase()
			.from("user_profiles")
			.upsert({
				user_id: userId,
				interests,
				insights,
				contact: contact || null,
				avatar: avatar || null,
				profile_completed: true,
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (profileError) throw profileError;

		// Save individual interests
		const interestRecords: Omit<UserInterest, "id" | "created_at">[] = [];
		Object.entries(interests).forEach(([category, interestList]) => {
			interestList.forEach((interest) => {
				interestRecords.push({
					user_id: userId,
					category,
					interest_name: interest,
				});
			});
		});

		if (interestRecords.length > 0) {
			// Delete existing interests for this user first
			await getSupabase().from("user_interests").delete().eq("user_id", userId);

			// Insert new interests
			const { error: interestsError } = await getSupabase()
				.from("user_interests")
				.insert(interestRecords);

			if (interestsError) throw interestsError;
		}

		// Save individual insights
		const insightRecords: Omit<UserInsight, "id" | "created_at">[] = [];
		Object.entries(insights).forEach(([category, insightList]) => {
			insightList.forEach((insight) => {
				insightRecords.push({
					user_id: userId,
					category,
					insight_type: "recommendation",
					entity_id: insight.entity_id,
					entity_name: insight.name,
					popularity_score: insight.popularity || 0,
					metadata: { source: "ai" },
				});
			});
		});

		if (insightRecords.length > 0) {
			// Delete existing insights for this user first
			await getSupabase().from("user_insights").delete().eq("user_id", userId);

			// Insert new insights
			const { error: insightsError } = await getSupabase()
				.from("user_insights")
				.insert(insightRecords);

			if (insightsError) throw insightsError;
		}

		return { success: true, profile, userId };
	} catch (error) {
		console.error("Error saving user profile:", error);
		return { success: false, error };
	}
};

// Jaccard similarity calculation
const jaccard = (setA: Set<string>, setB: Set<string>): number => {
	if (setA.size === 0 && setB.size === 0) return 1;
	if (setA.size === 0 || setB.size === 0) return 0;

	const intersection = new Set([...setA].filter((x) => setB.has(x)));
	const union = new Set([...setA, ...setB]);
	return intersection.size / union.size;
};

// Weight different types based on cultural significance
const TYPE_WEIGHTS: Record<string, number> = {
	artist: 1.5,
	movie: 1.4,
	book: 1.3,
	album: 1.3,
	tv_show: 1.2,
	brand: 1.1,
	videogame: 1.0,
	podcast: 1.0,
	actor: 0.9,
	director: 0.9,
	author: 0.9,
	person: 0.8,
	destination: 0.8,
	place: 0.7,
	locality: 0.7,
	tag: 0.6,
	demographics: 0.5,
};

export const findSimilarUsers = async (userId: string) => {
	try {
		// Get current user's profile and interests
		const { data: currentUserProfile, error: profileError } = await getSupabase()
			.from("user_profiles")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (profileError) throw profileError;

		// Get all other users with their profiles and interests
		const { data: otherUsers, error: usersError } = await getSupabase()
			.from("user_profiles")
			.select(
				`
				*,
				user_interests (*)
			`
			)
			.neq("user_id", userId)
			.eq("profile_completed", true);

		if (usersError) throw usersError;

		// Organize current user's interests by type and entity_id
		const currentUserTasteVector: Record<string, Set<string>> = {};

		// Add original interests
		Object.entries(currentUserProfile.interests || {}).forEach(
			([type, interests]) => {
				if (!currentUserTasteVector[type]) {
					currentUserTasteVector[type] = new Set();
				}
				(interests as string[]).forEach((interest) => {
					currentUserTasteVector[type].add(interest.toLowerCase());
				});
			}
		);

		// Add entity IDs from insights (expanded taste fingerprint)
		Object.entries(currentUserProfile.insights || {}).forEach(
			([type, insightItems]) => {
				if (!currentUserTasteVector[type]) {
					currentUserTasteVector[type] = new Set();
				}
				(insightItems as InsightItem[]).forEach((item) => {
					currentUserTasteVector[type].add(item.entity_id);
					currentUserTasteVector[type].add(item.name.toLowerCase());
				});
			}
		);

		// Calculate matches
		const matches = [];

		for (const otherUser of otherUsers || []) {
			// Organize other user's taste vector
			const otherUserTasteVector: Record<string, Set<string>> = {};

			// Add original interests
			Object.entries(otherUser.interests || {}).forEach(([type, interests]) => {
				if (!otherUserTasteVector[type]) {
					otherUserTasteVector[type] = new Set();
				}
				(interests as string[]).forEach((interest) => {
					otherUserTasteVector[type].add(interest.toLowerCase());
				});
			});

			// Add entity IDs from insights
			Object.entries(otherUser.insights || {}).forEach(
				([type, insightItems]) => {
					if (!otherUserTasteVector[type]) {
						otherUserTasteVector[type] = new Set();
					}
					(insightItems as InsightItem[]).forEach((item) => {
						otherUserTasteVector[type].add(item.entity_id);
						otherUserTasteVector[type].add(item.name.toLowerCase());
					});
				}
			);

			// Calculate weighted similarity score
			let totalScore = 0;
			let totalWeight = 0;
			const sharedFields: string[] = [];
			const sharedEntities: Record<string, string[]> = {};

			// Check similarity for each type
			Object.entries(TYPE_WEIGHTS).forEach(([type, weight]) => {
				const currentSet = currentUserTasteVector[type] || new Set();
				const otherSet = otherUserTasteVector[type] || new Set();

				if (currentSet.size > 0 && otherSet.size > 0) {
					const similarity = jaccard(currentSet, otherSet);

					if (similarity > 0) {
						sharedFields.push(type);

						// Find shared entities
						const shared = [...currentSet].filter((x) => otherSet.has(x));
						if (shared.length > 0) {
							sharedEntities[type] = shared.slice(0, 5); // Limit to top 5
						}
					}

					totalScore += similarity * weight;
					totalWeight += weight;
				}
			});

			// Only include users with meaningful overlap
			if (totalWeight > 0 && sharedFields.length > 0) {
				const matchScore = totalScore / totalWeight;

				// Add bonus for high-signal domains
				let bonus = 0;
				const highSignalTypes = ["artist", "movie", "book", "brand"];
				highSignalTypes.forEach((type) => {
					if (sharedFields.includes(type)) {
						bonus += 0.1;
					}
				});

				matches.push({
					user: {
						user_id: otherUser.user_id,
						emoji: otherUser.emoji || null,
					avatar: otherUser.avatar || null,
						ai_profile: otherUser.taste_profile_headline
							? {
									headline: otherUser.taste_profile_headline,
									description: otherUser.taste_profile_description,
									vibe: otherUser.taste_profile_vibe,
									traits: otherUser.taste_profile_traits || [],
									compatibility: otherUser.taste_profile_compatibility,
							  }
							: null,
					},
					matchScore: Math.min(matchScore + bonus, 1), // Cap at 1.0
					sharedFields,
					sharedEntities,
					totalSharedItems: Object.values(sharedEntities).flat().length,
				});
			}
		}

		// Sort by match score and shared items count
		matches.sort((a, b) => {
			if (Math.abs(a.matchScore - b.matchScore) < 0.05) {
				// If scores are close, prioritize more shared items
				return b.totalSharedItems - a.totalSharedItems;
			}
			return b.matchScore - a.matchScore;
		});

		const topMatches = matches.slice(0, 10);

		return {
			success: true,
			similarUsers: topMatches,
			totalUsers: otherUsers?.length || 0,
			algorithm: "taste-based-jaccard-similarity",
		};
	} catch (error) {
		console.error("Error finding similar users:", error);
		return { success: false, error };
	}
};

// Save taste profile to database
export const saveTasteProfile = async (
	userId: string,
	tasteProfile: {
		headline: string;
		description: string;
		vibe: string;
		traits: string[];
		compatibility: string;
		emoji?: string;
	}
) => {
	try {
		const { data, error } = await getSupabase()
			.from("user_profiles")
			.update({
				taste_profile_headline: tasteProfile.headline,
				taste_profile_description: tasteProfile.description,
				taste_profile_vibe: tasteProfile.vibe,
				taste_profile_traits: tasteProfile.traits,
				taste_profile_compatibility: tasteProfile.compatibility,
				taste_profile_generated_at: new Date().toISOString(),
				emoji: tasteProfile.emoji,
			})
			.eq("user_id", userId)
			.select()
			.single();

		if (error) throw error;

		return { success: true, data };
	} catch (error) {
		console.error("Error saving taste profile:", error);
		return { success: false, error };
	}
};

// Get taste profile from database
export const getTasteProfile = async (userId: string) => {
	try {
		const { data, error } = await getSupabase()
			.from("user_profiles")
			.select(
				`
				taste_profile_headline,
				taste_profile_description,
				taste_profile_vibe,
				taste_profile_traits,
				taste_profile_compatibility,
				taste_profile_generated_at,
				emoji
			`
			)
			.eq("user_id", userId)
			.single();

		if (error) throw error;

		if (!data?.taste_profile_headline) {
			return { success: true, data: null };
		}

		return {
			success: true,
			data: {
				headline: data.taste_profile_headline,
				description: data.taste_profile_description,
				vibe: data.taste_profile_vibe,
				traits: data.taste_profile_traits || [],
				compatibility: data.taste_profile_compatibility,
				generated_at: data.taste_profile_generated_at,
				emoji: data.emoji,
			},
		};
	} catch (error) {
		console.error("Error getting taste profile:", error);
		return { success: false, error };
	}
};
