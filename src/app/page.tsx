"use client";

import React, {
	useState,
	useRef,
	KeyboardEvent,
	useEffect,
	useCallback,
} from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface ChipInputProps {
	id: string;
	placeholder: string;
	values: string[];
	onChange: (values: string[]) => void;
	className?: string;
}

const ChipInput: React.FC<ChipInputProps> = ({
	id,
	placeholder,
	values = [],
	onChange,
	className,
}) => {
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const addValue = (value: string) => {
		const trimmedValue = value.trim();
		if (trimmedValue && !values.includes(trimmedValue)) {
			onChange([...(values || []), trimmedValue]);
		}
	};

	const removeValue = (index: number) => {
		const newValues = values.filter((_, i) => i !== index);
		onChange(newValues);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const separators = [",", "  ", "\t"];

		// Check if any separator is in the value
		const hasSeparator = separators.some((sep) => value.includes(sep));

		if (hasSeparator) {
			// Split by multiple separators and add non-empty values
			const newValues = value
				.split(/[,\s\t]+/)
				.map((v) => v.trim())
				.filter((v) => v && !(values || []).includes(v));

			if (newValues.length > 0) {
				onChange([...(values || []), ...newValues]);
			}
			setInputValue("");
		} else {
			setInputValue(value);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (inputValue.trim()) {
				addValue(inputValue);
				setInputValue("");
			}
		} else if (
			e.key === "Backspace" &&
			!inputValue &&
			(values || []).length > 0
		) {
			removeValue((values || []).length - 1);
		}
	};

	return (
		<div
			className={`min-h-[42px] p-2 border rounded-md bg-slate-700 border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 hover:border-blue-400 transition-all duration-200 ${className}`}
			onClick={() => inputRef.current?.focus()}
		>
			<div className="flex flex-wrap gap-1 items-center">
				{(values || []).map((value, index) => (
					<motion.div
						key={`${value}-${index}`}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg text-white text-xs rounded-md font-medium"
					>
						<span>{value}</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								removeValue(index);
							}}
							className="text-blue-200 hover:text-white transition-colors ml-1 text-sm leading-none"
						>
							×
						</button>
					</motion.div>
				))}
				<input
					ref={inputRef}
					id={id}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={(values || []).length === 0 ? placeholder : ""}
					className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-400 text-sm"
				/>
			</div>
		</div>
	);
};

interface InsightItem {
	entity_id: string;
	name: string;
	popularity?: number;
	query?: {
		affinity?: number;
	};
}

interface AIProfile {
	headline: string;
	description: string;
	vibe: string;
	traits: string[];
	compatibility: string;
	emoji?: string;
}

interface MatchUser {
	user_id: string;
	name: string;
	location: string;
	bio: string;
	ai_profile?: AIProfile;
	emoji?: string;
}

interface Match {
	user: MatchUser;
	matchScore: number;
	sharedFields: string[];
	sharedEntities: Record<string, string[]>;
	totalSharedItems: number;
	compatibilityBlurb?: string;
	matchExplanation?: string;
	matchTags?: string[];
}

const QLOO_TYPES = [
	"artist",
	"album",
	"book",
	"movie",
	"tv_show",
	"destination",
	"place",
	"brand",
	"videogame",
	"podcast",
	"actor",
	"director",
	"author",
	"person",
	"locality",
	"tag",
	"demographics",
];

const getTypeEmoji = (type: string) => {
	const emojiMap: Record<string, string> = {
		artist: "🎤",
		album: "💿",
		book: "📚",
		movie: "🎬",
		tv_show: "📺",
		destination: "🌍",
		place: "📍",
		brand: "🏷️",
		videogame: "🎮",
		podcast: "🎧",
		actor: "🎭",
		director: "🎬",
		author: "✍️",
		person: "👤",
		locality: "🏘️",
		tag: "🏷️",
		demographics: "👥",
	};
	return emojiMap[type] || "⭐";
};

// Expand raw interests into related entities via Claude (replaces the old Qloo pipeline)
async function expandTastes(
	interests: Record<string, string[]>
): Promise<Record<string, InsightItem[]>> {
	try {
		const res = await fetch("/api/expand-tastes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ interests }),
		});
		const json = await res.json();
		return json.data || {};
	} catch (error) {
		console.error("Error expanding tastes:", error);
		return {};
	}
}

const getPlaceholder = (type: string) => {
	const placeholders: Record<string, string> = {
		artist: "The Beatles, Taylor Swift, Drake",
		album: "Abbey Road, 1989, Thriller",
		book: "1984, Harry Potter, The Hobbit",
		movie: "Inception, The Matrix, Interstellar",
		tv_show: "Breaking Bad, Game of Thrones, Friends",
		destination: "Paris, Tokyo, New York",
		place: "Coffee shop, Library, Beach",
		brand: "Nike, Apple, Starbucks",
		videogame: "The Witcher 3, Minecraft, Zelda",
		podcast: "Joe Rogan, This American Life",
		actor: "Leonardo DiCaprio, Meryl Streep",
		director: "Christopher Nolan, Quentin Tarantino",
		author: "George Orwell, J.K. Rowling",
		person: "Albert Einstein, Steve Jobs",
		locality: "New York, London, Tokyo",
		tag: "Adventure, Comedy, Romance",
		demographics: "Millennials, Gen Z, Baby Boomers",
	};
	return placeholders[type] || "Add multiple items...";
};

export default function ProfileForm() {
	const [showWelcome, setShowWelcome] = useState(true);
	const [showLogin, setShowLogin] = useState(false);
	const [showUserProfile, setShowUserProfile] = useState(false);
	const [loginUserId, setLoginUserId] = useState("");
	const [loginError, setLoginError] = useState("");
	const [userProfileData, setUserProfileData] =
		useState<UserProfileData | null>(null);
	const [formData, setFormData] = useState<Record<string, string[]>>({});
	const [userId, setUserId] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [profileSaved, setProfileSaved] = useState(false);
	const [matches, setMatches] = useState<Match[]>([]);
	const [loadingMatches, setLoadingMatches] = useState(false);
	const [connectionUserId, setConnectionUserId] = useState("");
	const [connectionUserIdError, setConnectionUserIdError] = useState("");
	const [contactInfo, setContactInfo] = useState("");
	const [contactError, setContactError] = useState("");
	const [generatingUsername, setGeneratingUsername] = useState(false);
	const [bulkInput, setBulkInput] = useState("");
	const [showBulkInput, setShowBulkInput] = useState(false);

	const handleChange = useCallback((type: string, values: string[]) => {
		setFormData((prevFormData) => ({ ...prevFormData, [type]: values }));
	}, []);

	const handleLogin = async () => {
		if (!loginUserId.trim()) {
			setLoginError("Please enter your User ID");
			return;
		}

		setIsLoading(true);
		try {
			// Check if user exists and get their profile
			const response = await fetch("/api/get-user-profile", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: loginUserId }),
			});

			const result = await response.json();
			if (result.success && result.data) {
				setUserId(loginUserId);
				setUserProfileData(result.data);
				setShowLogin(false);
				setShowWelcome(false);
				setShowUserProfile(true);
				setLoginError("");
			} else {
				setLoginError(
					"User ID not found. Please check your ID or create a new profile."
				);
			}
		} catch (error) {
			console.error("Error during login:", error);
			setLoginError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const findMatches = async () => {
		setLoadingMatches(true);
		try {
			const response = await fetch("/api/find-matches", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: connectionUserId.trim() || userId }),
			});

			const result = await response.json();
			const matches = result.data || [];

			// Generate compatibility blurbs and match data for each match
			const matchesWithBlurbs = await Promise.all(
				matches.map(async (match: Match) => {
					try {
						const compatibilityResponse = await fetch(
							"/api/generate-compatibility",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									currentUserInterests: formData,
									currentUserId: connectionUserId.trim() || userId,
									matchUserProfile: match.user,
									sharedEntities: match.sharedEntities,
									matchScore: match.matchScore,
								}),
							}
						);

						const compatibilityResult = await compatibilityResponse.json();

						return {
							...match,
							matchExplanation: compatibilityResult.success
								? compatibilityResult.data.explanation
								: "You both share similar taste preferences that create a strong compatibility foundation.",
							matchTags: compatibilityResult.success
								? compatibilityResult.data.tags
								: ["Similar Tastes", "Good Match"],
							compatibilityBlurb: compatibilityResult.success
								? compatibilityResult.data.explanation
								: "You share amazing interests - this looks like a great potential connection!",
						};
					} catch (error) {
						console.error("Error generating match explanation:", error);
						return {
							...match,
							matchExplanation:
								"You both share similar taste preferences that create a strong compatibility foundation.",
							matchTags: ["Similar Tastes", "Good Match"],
							compatibilityBlurb:
								"You share amazing interests - this looks like a great potential connection!",
						};
					}
				})
			);

			setMatches(matchesWithBlurbs);
		} catch (error) {
			console.error("Error finding matches:", error);
		} finally {
			setLoadingMatches(false);
		}
	};

	const generateUsername = async () => {
		// Check if we have any interests to base the username on
		const hasInterests = Object.values(formData).some(
			(values) => values && values.length > 0
		);

		if (!hasInterests) {
			setConnectionUserIdError(
				"Please add some interests first to generate a username"
			);
			return;
		}

		setGeneratingUsername(true);
		setConnectionUserIdError("");

		try {
			// Prepare interests text for AI
			const interestsText = Object.entries(formData)
				.filter(([, values]) => Array.isArray(values) && values.length > 0)
				.map(
					([category, values]) =>
						`${category}: ${(values as string[]).join(", ")}`
				)
				.join("\n");

			const prompt = `
Based on the following user interests, generate a creative, unique username that reflects their personality and tastes. The username should be:
- 6-15 characters long
- Easy to remember and type
- Creative but not too obscure
- Reflects their interests/personality
- Uses alphanumeric characters only (no special characters except underscores)

USER INTERESTS:
${interestsText}

Please respond with ONLY the username, nothing else.`;

			const response = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					interests: formData,
					insights: {},
					prompt: prompt,
					generateUsernameOnly: true,
				}),
			});

			const result = await response.json();

			if (result.success && result.data) {
				// Extract username from the response
				let username = result.data;
				if (typeof result.data === "object" && result.data.username) {
					username = result.data.username;
				} else if (typeof result.data === "string") {
					username = result.data.trim();
				}

				// Clean the username (remove any extra text, quotes, etc.)
				username = username.replace(/[^a-zA-Z0-9_]/g, "").substring(0, 15);

				if (username) {
					setConnectionUserId(username);
				} else {
					setConnectionUserIdError(
						"Failed to generate username. Please try again."
					);
				}
			} else {
				setConnectionUserIdError(
					"Failed to generate username. Please try again."
				);
			}
		} catch (error) {
			console.error("Error generating username:", error);
			setConnectionUserIdError("Error generating username. Please try again.");
		} finally {
			setGeneratingUsername(false);
		}
	};

	// Bulk input parsing function
	const parseAndFillFields = (inputString: string) => {
		const values = inputString
			.split(";")
			.map((v) => v.trim())
			.filter((v) => v.length > 0);
		const fields = [
			"artist",
			"album",
			"book",
			"movie",
			"tv_show",
			"destination",
			"place",
			"brand",
			"videogame",
			"podcast",
			"actor",
			"director",
			"author",
			"person",
			"locality",
			"tag",
			"demographics",
		];

		const newFormData = { ...formData };

		fields.forEach((field, index) => {
			if (values[index]) {
				// Split by commas if multiple values in one field
				const fieldValues = values[index]
					.split(",")
					.map((v) => v.trim())
					.filter((v) => v.length > 0);
				newFormData[field] = fieldValues;
			}
		});

		// Handle contact info (second to last value)
		if (values[values.length - 2]) {
			setContactInfo(values[values.length - 2]);
		}

		// Handle username (last value)
		if (values[values.length - 1]) {
			setConnectionUserId(values[values.length - 1]);
		}

		setFormData(newFormData);
		setBulkInput("");
		setShowBulkInput(false);
	};

	const checkUserIdUnique = async (testUserId: string) => {
		try {
			const response = await fetch("/api/check-user-id", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: testUserId }),
			});

			const result = await response.json();
			return !result.exists;
		} catch (error) {
			console.error("Error checking user ID:", error);
			return false;
		}
	};

	const handleUpdateProfile = async () => {
		if (!userId) {
			console.error("No user ID available for update");
			return;
		}

		setIsLoading(true);

		try {
			const insightMap = await expandTastes(formData);

			// Update existing profile using the update endpoint
			const updateResponse = await fetch("/api/update-user-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: userId,
					interests: formData,
					insights: insightMap,
				}),
			});

			const updateResult = await updateResponse.json();

			if (!updateResult.success) {
				console.error("Failed to update profile. Full response:", updateResult);
				console.error(
					"Error details:",
					updateResult.error || "No error details provided"
				);
				console.error("Response status:", updateResponse.status);
				alert(
					`Failed to update profile: ${
						updateResult.error || "Unknown error"
					}. Please try again.`
				);
			}
		} catch (error) {
			console.error("Error during profile update:", error);
			alert("An error occurred while updating your profile. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// Make sure the chosen username isn't taken before doing the heavy work
			if (connectionUserId.trim()) {
				const isUnique = await checkUserIdUnique(connectionUserId.trim());
				if (!isUnique) {
					setConnectionUserIdError(
						"This username is already taken. Pick another or log in with it."
					);
					setIsLoading(false);
					return;
				}
			}

			const insightMap = await expandTastes(formData);

			// Save to database
			const saveResponse = await fetch("/api/save-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: connectionUserId || undefined, // Let the API generate one if not provided
					interests: formData,
					insights: insightMap,
					contact: contactInfo || undefined, // Add contact info
				}),
			});

			const saveResult = await saveResponse.json();

			if (saveResult.success) {
				setUserId(saveResult.data.userId);
				setProfileSaved(true);

				try {
					const profileResponse = await fetch("/api/get-user-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ userId: saveResult.data.userId }),
					});
					const profileResult = await profileResponse.json();
					if (profileResult.success && profileResult.data) {
						setUserProfileData(profileResult.data);
					}
				} catch (profileError) {
					console.error("Error loading user profile data:", profileError);
				}

				// Generate AI profile description
				try {
					const aiResponse = await fetch("/api/generate-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							interests: formData,
							insights: insightMap,
						}),
					});

					const aiResult = await aiResponse.json();
					if (aiResult.success && aiResult.data && aiResult.data.headline) {
						// Navigate directly to user profile instead of showing modal
						setShowUserProfile(true);
					} else {
						console.error(
							"Failed to generate AI profile or invalid data:",
							aiResult
						);
						// Navigate to user profile even if AI generation fails
						setShowUserProfile(true);
					}
				} catch (aiError) {
					console.error("Error generating AI profile:", aiError);
					// Navigate to user profile even if AI generation fails
					setShowUserProfile(true);
				}
			} else {
				console.error("Failed to save profile:", saveResult.error);
				alert("Failed to save profile. Please try again.");
			}
		} catch (error) {
			console.error("Error during profile creation:", error);
			alert("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
			{/* Subtle background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<motion.div
					animate={{
						rotate: 360,
						scale: [1, 1.05, 1],
					}}
					transition={{
						duration: 30,
						repeat: Infinity,
						ease: "linear",
					}}
					className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-full blur-3xl"
				/>
				<motion.div
					animate={{
						rotate: -360,
						scale: [1, 1.08, 1],
					}}
					transition={{
						duration: 35,
						repeat: Infinity,
						ease: "linear",
					}}
					className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
				/>
			</div>

			{showWelcome ? (
				<WelcomeScreen
					onGetStarted={() => {
						// Clear form data for fresh profile creation
						setFormData({});
						setUserId("");
						setProfileSaved(false);
						setShowWelcome(false);
					}}
					onLogin={() => {
						setShowWelcome(false);
						setShowLogin(true);
					}}
				/>
			) : showLogin ? (
				<LoginScreen
					loginUserId={loginUserId}
					setLoginUserId={setLoginUserId}
					loginError={loginError}
					isLoading={isLoading}
					onLogin={handleLogin}
					onBack={() => {
						setShowLogin(false);
						setShowWelcome(true);
						setLoginError("");
						setLoginUserId("");
					}}
				/>
			) : showUserProfile ? (
				<UserProfileScreen
					userProfileData={userProfileData}
					setUserProfileData={setUserProfileData}
					userId={userId}
					findMatches={findMatches}
					loadingMatches={loadingMatches}
					matches={matches}
					formData={formData}
					handleChange={handleChange}
					bulkInput={bulkInput}
					setBulkInput={setBulkInput}
					showBulkInput={showBulkInput}
					setShowBulkInput={setShowBulkInput}
					parseAndFillFields={parseAndFillFields}
					handleUpdateProfile={handleUpdateProfile}
					isLoading={isLoading}
					onLogout={() => {
						// Clear all data for clean session
						setShowUserProfile(false);
						setShowWelcome(true);
						setUserId("");
						setUserProfileData(null);
						setFormData({});
						setMatches([]);
						setProfileSaved(false);
					}}
				/>
			) : (
				<ProfileFormScreen
					formData={formData}
					handleChange={handleChange}
					handleSubmit={handleSubmit}
					isLoading={isLoading}
					profileSaved={profileSaved}
					userId={userId}
					connectionUserId={connectionUserId}
					setConnectionUserId={setConnectionUserId}
					connectionUserIdError={connectionUserIdError}
					setConnectionUserIdError={setConnectionUserIdError}
					contactInfo={contactInfo}
					setContactInfo={setContactInfo}
					contactError={contactError}
					setContactError={setContactError}
					generateUsername={generateUsername}
					generatingUsername={generatingUsername}
					bulkInput={bulkInput}
					setBulkInput={setBulkInput}
					showBulkInput={showBulkInput}
					setShowBulkInput={setShowBulkInput}
					parseAndFillFields={parseAndFillFields}
				/>
			)}
		</div>
	);
}

const WelcomeScreen = ({
	onGetStarted,
	onLogin,
}: {
	onGetStarted: () => void;
	onLogin: () => void;
}) => {
	return (
		<div className="h-full flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-4xl mx-auto w-full justify-center"
			>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className="text-center mt-6 mb-6 px-4"
				>
					{/* Badge */}
					<p className="inline-block px-3 py-1 mb-3 text-xs font-medium text-pink-300 border border-pink-400 rounded-full">
						Social Discovery Reimagined
					</p>

					{/* Main Heading */}
					<h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-purple-500 via-pink-400 to-orange-300 bg-clip-text text-transparent font-heading drop-shadow-[0_2px_12px_rgba(80,0,180,0.25)]">
						Mutuals
					</h1>

					{/* Subheadline */}
					<p className="text-xl md:text-2xl text-slate-200 mb-1 font-medium tracking-wide font-sans">
						Find people who love what you love
					</p>

					{/* Description */}
					<p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
						Connect with people who share your passions. Discover communities
						and build real friendships.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="max-w-3xl mx-auto w-full"
				>
					<Card className="shadow-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm">
						<CardContent className="p-8">
							{/* Top 3 Features */}
							<div className="grid md:grid-cols-3 gap-6 mb-8">
								{[
									{
										emoji: "🎯",
										title: "Smart Matching",
										desc: "Find people who truly align with your interests.",
										colors: "from-blue-500 to-indigo-500",
									},
									{
										emoji: "🌟",
										title: "Discover Communities",
										desc: "Join groups around topics you care about.",
										colors: "from-purple-500 to-pink-500",
									},
									{
										emoji: "🤝",
										title: "Real Connections",
										desc: "Build friendships that go beyond surface level.",
										colors: "from-pink-500 to-orange-500",
									},
								].map((item, i) => (
									<motion.div
										key={i}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
										className="text-center group"
									>
										<div
											className={`w-14 h-14 mx-auto mb-3 bg-gradient-to-r ${item.colors} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}
										>
											<span className="text-xl">{item.emoji}</span>
										</div>
										<h3 className="text-base font-semibold text-slate-200 mb-1">
											{item.title}
										</h3>
										<p className="text-xs text-slate-400">{item.desc}</p>
									</motion.div>
								))}
							</div>

							{/* CTA Buttons */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.0, duration: 0.4 }}
								className="text-center"
							>
								<div className="space-y-4">
									<Button
										onClick={onGetStarted}
										size="lg"
										className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg text-white transform hover:scale-105"
									>
										Get Started ✨
									</Button>
									<p className="text-xs text-slate-500">
										Takes less than 2 minutes to set up your profile
									</p>

									<div className="flex items-center gap-3 my-4">
										<div className="flex-1 h-px bg-slate-700"></div>
										<span className="text-sm text-slate-400">or</span>
										<div className="flex-1 h-px bg-slate-700"></div>
									</div>

									<Button
										onClick={onLogin}
										size="lg"
										className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-2xl border border-blue-400/30 hover:border-blue-300/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-blue-500/25"
									>
										<span className="mr-2">🔑</span>
										Login with User ID
									</Button>
									<p className="text-xs text-slate-500">
										Already have an account? Sign in with your User ID
									</p>
								</div>
							</motion.div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
};

const LoginScreen = ({
	loginUserId,
	setLoginUserId,
	loginError,
	isLoading,
	onLogin,
	onBack,
}: {
	loginUserId: string;
	setLoginUserId: (value: string) => void;
	loginError: string;
	isLoading: boolean;
	onLogin: () => void;
	onBack: () => void;
}) => {
	return (
		<div className="h-full flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-2xl mx-auto w-full justify-center"
			>
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className="text-center mb-6"
				>
					<h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-heading drop-shadow-[0_2px_12px_rgba(80,0,180,0.25)]">
						Welcome Back
					</h1>
					<p className="text-base md:text-lg text-slate-300 font-medium mb-1">
						Sign in with your User ID
					</p>
					<p className="text-sm text-slate-400">
						Continue where you left off and connect with your tribe
					</p>
				</motion.div>

				{/* Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="w-full"
				>
					<Card className="shadow-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm">
						<CardContent className="p-6 md:p-8">
							<div className="space-y-6">
								{/* Input Field */}
								<div className="space-y-2">
									<Label
										htmlFor="login-user-id"
										className="text-slate-300 text-sm font-medium"
									>
										User ID
									</Label>
									<Input
										id="login-user-id"
										type="text"
										value={loginUserId}
										onChange={(e) => setLoginUserId(e.target.value)}
										placeholder="Enter your User ID"
										className="h-11 bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 text-sm"
										onKeyDown={(e) => {
											if (e.key === "Enter" && !isLoading) onLogin();
										}}
									/>
									{loginError && (
										<p className="text-red-400 text-xs mt-1">{loginError}</p>
									)}
								</div>

								{/* Action Buttons */}
								<div className="space-y-4">
									<Button
										onClick={onLogin}
										disabled={isLoading}
										className="w-full h-11 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.97]"
									>
										{isLoading ? (
											<>
												<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
												Signing In...
											</>
										) : (
											"Sign In 🔑"
										)}
									</Button>

									<Button
										onClick={onBack}
										className="w-full h-11 text-sm md:text-base bg-gradient-to-r from-slate-600/80 to-slate-500/80 hover:from-slate-500 hover:to-slate-400 text-white border border-slate-400/30 hover:border-slate-300/50 shadow-md hover:shadow-slate-500/25 transition-all duration-200"
									>
										<span className="mr-2">←</span> Back to Home
									</Button>
								</div>

								{/* Footer */}
								<div className="text-center pt-4 border-t border-slate-700">
									<p className="text-xs text-slate-400">
										Don&apos;t have a User ID?{" "}
										<button
											onClick={onBack}
											className="text-blue-400 hover:text-blue-300 underline"
										>
											Create a new profile
										</button>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
};

interface UserProfileData {
	profile: {
		user_id: string;
		name?: string;
		location?: string;
		bio?: string;
		ai_profile?: string;
		emoji?: string;
		interests?: Record<string, string[]>;
	};
	interests: Record<string, string[]>;
	insights: InsightItem[];
}

const UserProfileScreen = ({
	userProfileData,
	setUserProfileData,
	userId,
	findMatches,
	loadingMatches,
	matches,
	onLogout,
	formData,
	handleChange,
	bulkInput,
	setBulkInput,
	showBulkInput,
	setShowBulkInput,
	parseAndFillFields,
	handleUpdateProfile,
	isLoading,
}: {
	userProfileData: UserProfileData | null;
	setUserProfileData: (data: UserProfileData | null) => void;
	userId: string;
	findMatches: () => void;
	loadingMatches: boolean;
	matches: Match[];
	onLogout: () => void;
	formData: Record<string, string[]>;
	handleChange: (type: string, values: string[]) => void;
	bulkInput: string;
	setBulkInput: (value: string) => void;
	showBulkInput: boolean;
	setShowBulkInput: (show: boolean) => void;
	parseAndFillFields: (inputString: string) => void;
	handleUpdateProfile: () => Promise<void>;
	isLoading: boolean;
}) => {
	const [tasteProfile, setTasteProfile] = useState<AIProfile | null>(null);
	const [loadingTasteProfile, setLoadingTasteProfile] = useState(false);
	const [showMatches, setShowMatches] = useState(false);
	const [activeTab, setActiveTab] = useState<"profile" | "interests">(
		"profile"
	);

	// Load current user interests into formData
	const interestsLoadedRef = useRef(false);

	useEffect(() => {
		if (userProfileData?.profile?.interests && !interestsLoadedRef.current) {
			// Handle malformed interests data where categories might be undefined
			const cleanedInterests: Record<string, string[]> = {};

			// Copy over any properly categorized interests
			Object.entries(userProfileData.profile.interests).forEach(
				([key, values]) => {
					if (
						key !== "undefined" &&
						key &&
						QLOO_TYPES.includes(key) &&
						Array.isArray(values)
					) {
						cleanedInterests[key] = values;
					}
				}
			);

			// We need to call handleChange for each type to properly update the parent state
			Object.entries(cleanedInterests).forEach(([type, values]) => {
				handleChange(type, values);
			});

			interestsLoadedRef.current = true;
		}
	}, [userProfileData?.profile?.interests, handleChange]);

	// Handle finding matches within UserProfileScreen
	const handleFindMatches = async () => {
		try {
			await findMatches();
			setShowMatches(true);
		} catch (error) {
			console.error("Error finding matches:", error);
		}
	};

	// Handle profile update within UserProfileScreen
	const handleProfileUpdate = async () => {
		try {
			await handleUpdateProfile();

			// After successful update, switch to profile tab and regenerate taste profile
			setActiveTab("profile");

			// Fetch fresh user profile data and then generate taste profile
			if (userId) {
				try {
					const response = await fetch("/api/get-user-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ userId: userId }),
					});
					const result = await response.json();
					if (result.success && result.data) {
						// Update state with fresh data
						setUserProfileData(result.data);

						// Now generate taste profile with fresh interests
						setTimeout(() => {
							generateTasteProfile();
						}, 100);
					}
				} catch (error) {
					console.error("❌ Error fetching fresh profile data:", error);
				}
			}
		} catch (error) {
			console.error("❌ Error updating profile:", error);
		}
	};

	// Generate taste profile function
	const generateTasteProfile = useCallback(async () => {
		if (!userProfileData?.profile?.interests) {
			return;
		}

		setLoadingTasteProfile(true);
		try {
			const insightMap: Record<string, InsightItem[]> = {};

			// Generate AI profile
			const aiResponse = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					interests: userProfileData.profile.interests,
					insights: insightMap,
				}),
			});

			const aiResult = await aiResponse.json();
			if (aiResult.success && aiResult.data && aiResult.data.headline) {
				setTasteProfile(aiResult.data);

				// Save to database
				const saveResponse = await fetch("/api/save-taste-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						tasteProfile: aiResult.data,
					}),
				});

				const saveResult = await saveResponse.json();
				if (!saveResult.success) {
					console.error("Failed to save taste profile:", saveResult.error);
				} else {
					// Update user profile emoji to match taste profile
					if (aiResult.data.emoji && userProfileData) {
						const updatedUserProfile = {
							...userProfileData,
							profile: {
								...userProfileData.profile,
								emoji: aiResult.data.emoji,
							},
						};
						setUserProfileData(updatedUserProfile);

						// Save updated emoji to user profile
						const updateProfileResponse = await fetch(
							"/api/update-user-profile",
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									userId,
									profileData: { emoji: aiResult.data.emoji },
								}),
							}
						);

						const updateResult = await updateProfileResponse.json();
						if (!updateResult.success) {
							console.error(
								"Failed to update user profile emoji:",
								updateResult.error
							);
						}
					}
				}
			}
		} catch (error) {
			console.error("Error generating taste profile:", error);
		} finally {
			setLoadingTasteProfile(false);
		}
	}, [userProfileData, userId, setUserProfileData]);

	// Load taste profile on mount and auto-generate if not found
	useEffect(() => {
		const loadTasteProfile = async () => {
			try {
				const response = await fetch("/api/get-taste-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId }),
				});
				const result = await response.json();
				if (result.success && result.data) {
					setTasteProfile(result.data);
				} else {
					// If no taste profile exists and user has interests, auto-generate
					if (
						userProfileData?.profile?.interests &&
						Object.keys(userProfileData.profile.interests).length > 0
					) {
						generateTasteProfile();
					}
				}
			} catch (error) {
				console.error("Error loading taste profile:", error);
			}
		};

		if (userId) {
			loadTasteProfile();
		}
	}, [userId, userProfileData?.profile?.interests, generateTasteProfile]);

	return (
		<div className="h-screen flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0"
			>
				<Card className="shadow-xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm flex-1 min-h-0 w-full">
					<CardContent className="p-6 md:p-8 h-full flex flex-col">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.6 }}
							className="flex-1 flex flex-col min-h-0"
						>
							{/* Header */}
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-11 h-11 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
										{(
											tasteProfile?.emoji ||
											userProfileData?.profile?.emoji ||
											"👤"
										).slice(0, 2)}
									</div>
									<div className="text-left">
										<h1 className="text-base md:text-lg font-bold text-slate-200">
											{userProfileData?.profile?.name || userId}
										</h1>
										<p className="text-sm text-slate-400">
											{tasteProfile?.headline ||
												"Building your taste profile..."}
										</p>
									</div>
								</div>
								<Button
									onClick={onLogout}
									size="sm"
									className="text-xs px-3 py-1.5 bg-gradient-to-r from-red-600/80 to-red-500/80 hover:from-red-500 hover:to-red-400 text-white border border-red-400/30 hover:border-red-300/50 shadow-md hover:shadow-red-500/25 transition-all duration-200"
								>
									<span className="mr-1">👋</span>
									Logout
								</Button>
							</div>

							{/* Tab Navigation */}
							{!showMatches && (
								<div className="flex border-b border-slate-600 mb-6">
									<button
										onClick={() => setActiveTab("profile")}
										className={`px-4 md:px-6 py-2.5 md:py-3 font-medium transition-colors ${
											activeTab === "profile"
												? "text-blue-400 border-b-2 border-blue-400"
												: "text-slate-400 hover:text-slate-200"
										}`}
									>
										Your Taste Profile
									</button>
									<button
										onClick={() => setActiveTab("interests")}
										className={`px-4 md:px-6 py-2.5 md:py-3 font-medium transition-colors ${
											activeTab === "interests"
												? "text-blue-400 border-b-2 border-blue-400"
												: "text-slate-400 hover:text-slate-200"
										}`}
									>
										Update Interests
									</button>
								</div>
							)}

							{/* Scrollable Content Area */}
							<div className="flex-1 overflow-y-auto pr-2 mb-4">
								{showMatches ? (
									/* Matches View */
									<>
										<div className="flex items-center justify-between mb-6">
											<h2 className="text-2xl font-bold text-slate-200 font-heading">
												Your Matches 🤝
											</h2>
											<div className="text-slate-400 text-sm">
												{matches.length} matches found
											</div>
										</div>

										<div className="flex-1 overflow-y-auto pr-2 mb-6">
											{matches.length > 0 ? (
												<div className="space-y-4">
													{matches.map((match, index) => (
														<div
															key={index}
															className="p-6 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all duration-200"
														>
															<div className="flex items-center justify-between mb-4">
																<div className="flex items-center gap-3">
																	<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-lg">
																		{match.user.emoji || "👤"}
																	</div>
																	<div>
																		<h3 className="font-semibold text-slate-200">
																			{match.user.user_id}
																		</h3>
																		<p className="text-slate-400 text-sm">
																			{match.user.ai_profile?.headline ||
																				"Building their taste profile..."}
																		</p>
																	</div>
																</div>
																<div className="text-right">
																	<div className="text-lg font-bold text-green-400">
																		{Math.round(match.matchScore * 100)}%
																	</div>
																	<div className="text-xs text-slate-400">
																		compatibility
																	</div>
																</div>
															</div>

															{/* AI Match Explanation */}
															<div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
																<p className="text-slate-300 text-sm leading-relaxed">
																	{match.matchExplanation ||
																		(index === 0
																			? "You both have an eclectic taste in indie music and experimental art. Your shared appreciation for underground artists and avant-garde aesthetics creates a unique creative connection that's rare to find."
																			: "Your mutual love for classic literature and film noir suggests you both appreciate depth and complexity in storytelling. This intellectual compatibility combined with similar lifestyle preferences makes for engaging conversations.")}
																</p>
															</div>

															{/* AI Match Tags */}
															{match.matchTags && match.matchTags.length > 0 ? (
																<div className="space-y-2">
																	<h4 className="text-sm font-medium text-slate-300 font-heading">
																		Match Reasons
																	</h4>
																	<div className="flex flex-wrap gap-2">
																		{match.matchTags.map(
																			(tag: string, idx: number) => (
																				<span
																					key={idx}
																					className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs border border-purple-500/30"
																				>
																					{tag}
																				</span>
																			)
																		)}
																	</div>
																</div>
															) : (
																<div className="space-y-2">
																	<h4 className="text-sm font-medium text-slate-300 font-heading">
																		Match Reasons
																	</h4>
																	<div className="flex flex-wrap gap-2">
																		{(index === 0
																			? [
																					"Indie Music Lovers",
																					"Art Enthusiasts",
																					"Creative Mindset",
																					"Underground Culture",
																			  ]
																			: [
																					"Literary Minds",
																					"Film Buffs",
																					"Deep Thinkers",
																					"Cultural Appreciation",
																					"Sophisticated Taste",
																			  ]
																		).map((tag, idx) => (
																			<span
																				key={idx}
																				className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs border border-purple-500/30"
																			>
																				{tag}
																			</span>
																		))}
																	</div>
																</div>
															)}
														</div>
													))}
													{/* Commented out to show only 2 results for testing
													{matches.map((match, index) => (
														<div
															key={index}
															className="p-6 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all duration-200"
														>
															...
														</div>
													))}
													*/}
												</div>
											) : (
												<div className="flex-1 flex items-center justify-center">
													<div className="text-center">
														<div className="text-6xl mb-4">🔍</div>
														<h3 className="text-xl font-semibold text-slate-200 mb-2 font-heading">
															No matches found
														</h3>
														<p className="text-slate-400">
															Try adding more interests to find better matches
														</p>
													</div>
												</div>
											)}
										</div>
									</>
								) : activeTab === "profile" ? (
									<div className="space-y-5 flex-1 flex flex-col min-h-0 mb-4 text-sm">
										{userProfileData?.profile?.ai_profile && (
											<div className="p-4 rounded-lg border border-slate-600/40 bg-slate-800/60">
												<h3 className="text-base font-semibold text-slate-200 mb-2 font-heading">
													Your Vibe
												</h3>
												<p className="text-slate-300 leading-relaxed text-sm">
													{
														JSON.parse(userProfileData.profile.ai_profile)
															.description
													}
												</p>
											</div>
										)}

										{/* Taste Profile Section */}
										<div className="p-4 rounded-lg flex-1 flex flex-col">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
														<span className="text-xs">✨</span>
													</div>
													<h3 className="text-base font-semibold text-slate-200 font-heading">
														Your Taste Profile
													</h3>
													{loadingTasteProfile && (
														<div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
													)}
												</div>
											</div>

											<div className="flex-1 overflow-y-auto pr-1">
												{tasteProfile ? (
													<div className="space-y-3 text-sm">
														{/* Headline */}
														<div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
															<h4 className="text-blue-400 font-semibold mb-1">
																Headline
															</h4>
															<p className="text-slate-200 text-sm">
																{tasteProfile.headline}
															</p>
														</div>

														{/* Description */}
														<div className="p-3 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
															<h4 className="text-green-400 font-semibold mb-1">
																Description
															</h4>
															<p className="text-slate-200 text-sm">
																{tasteProfile.description}
															</p>
														</div>

														{/* Vibe */}
														{tasteProfile.vibe && (
															<div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
																<h4 className="text-purple-400 font-semibold mb-1">
																	Vibe
																</h4>
																<p className="text-slate-200 text-sm">
																	{tasteProfile.vibe}
																</p>
															</div>
														)}

														{/* Traits */}
														{tasteProfile.traits &&
															Array.isArray(tasteProfile.traits) && (
																<div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
																	<h4 className="text-orange-400 font-semibold mb-1">
																		Key Traits
																	</h4>
																	<div className="flex flex-wrap gap-2">
																		{tasteProfile.traits.map(
																			(trait: string, index: number) => (
																				<span
																					key={index}
																					className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full text-xs"
																				>
																					{trait}
																				</span>
																			)
																		)}
																	</div>
																</div>
															)}

														{/* Compatibility */}
														{tasteProfile.compatibility && (
															<div className="p-3 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-lg border border-indigo-500/20">
																<h4 className="text-indigo-400 font-semibold mb-1">
																	Compatibility
																</h4>
																<p className="text-slate-200 text-sm">
																	{tasteProfile.compatibility}
																</p>
															</div>
														)}
													</div>
												) : (
													<div className="text-center py-6">
														<p className="text-slate-400 text-sm">
															{loadingTasteProfile
																? "Generating your taste profile..."
																: "Your taste profile will appear here once generated"}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								) : (
									/* Interests Tab */
									<div className="space-y-6">
										{/* Bulk Input Section */}
										<div className="border-b border-slate-600 pb-6">
											<div className="flex items-center justify-between mb-3">
												<h3 className="text-lg font-semibold text-slate-200">
													Quick Fill
												</h3>
												<button
													type="button"
													onClick={() => setShowBulkInput(!showBulkInput)}
													className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
												>
													{showBulkInput ? "Hide" : "Show"} Bulk Input
												</button>
											</div>

											{showBulkInput && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													className="space-y-3"
												>
													<p className="text-xs text-slate-400">
														Paste values separated by semicolons (;) to
														auto-fill all fields. Format:
														artist1,artist2;album1,album2;book1,book2;...
													</p>
													<textarea
														value={bulkInput}
														onChange={(e) => setBulkInput(e.target.value)}
														placeholder="Enter semicolon-separated values..."
														className="w-full h-24 p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
													<div className="flex gap-2">
														<button
															type="button"
															onClick={() => parseAndFillFields(bulkInput)}
															disabled={!bulkInput.trim()}
															className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm transition-colors"
														>
															Parse & Fill Fields
														</button>
														<button
															type="button"
															onClick={() => {
																setBulkInput("");
																setShowBulkInput(false);
															}}
															className="px-4 py-2 bg-slate-600 text-slate-300 rounded-md hover:bg-slate-700 text-sm transition-colors"
														>
															Clear
														</button>
													</div>
												</motion.div>
											)}
										</div>

										{/* Interests Grid */}
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
											{QLOO_TYPES.map((type, index) => (
												<motion.div
													key={type}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{
														delay: 0.1 + index * 0.03,
														duration: 0.4,
													}}
													className="space-y-3 group"
												>
													<Label
														htmlFor={type}
														className="capitalize text-sm font-semibold text-slate-300 flex items-center gap-2 group-hover:text-blue-400 transition-colors"
													>
														<span className="text-base">
															{getTypeEmoji(type)}
														</span>
														{type.replace("_", " ")}
													</Label>
													<ChipInput
														id={type}
														placeholder={`e.g. ${getPlaceholder(type)}`}
														values={formData[type] || []}
														onChange={(values) => handleChange(type, values)}
													/>
												</motion.div>
											))}
										</div>
									</div>
								)}
							</div>

							<div className="pt-6 border-t border-slate-700 flex-shrink-0">
								<Button
									onClick={
										showMatches
											? () => setShowMatches(false)
											: activeTab === "interests"
											? handleProfileUpdate
											: handleFindMatches
									}
									disabled={
										(activeTab === "interests" && isLoading) ||
										(!showMatches &&
											activeTab !== "interests" &&
											loadingMatches)
									}
									className={`w-full flex items-center justify-center gap-2 h-12 text-base font-medium text-white 
      ${
				showMatches || activeTab === "interests"
					? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border border-blue-500/50 shadow-md hover:shadow-blue-500/30"
					: "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 border border-purple-500/50 shadow-md hover:shadow-purple-500/30"
			}
      rounded-xl transition-all duration-200`}
								>
									{(activeTab === "interests" && isLoading) ||
									(!showMatches &&
										activeTab !== "interests" &&
										loadingMatches) ? (
										<>
											<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
											{activeTab === "interests"
												? "Updating..."
												: "Matching..."}
										</>
									) : showMatches ? (
										<>
											<span className="text-base">←</span>
											Go to Profile
										</>
									) : activeTab === "interests" ? (
										<>
											<span className="text-base">🔁</span>
											Update Profile
										</>
									) : (
										<>
											<span className="text-base">✨</span>
											Find Your Tribe
										</>
									)}
								</Button>
							</div>
						</motion.div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
};

interface ProfileFormScreenProps {
	formData: Record<string, string[]>;
	handleChange: (type: string, values: string[]) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	isLoading: boolean;
	profileSaved: boolean;
	userId: string;
	connectionUserId: string;
	setConnectionUserId: (value: string) => void;
	connectionUserIdError: string;
	setConnectionUserIdError: (error: string) => void;
	contactInfo: string;
	setContactInfo: (value: string) => void;
	contactError: string;
	setContactError: (error: string) => void;
	generateUsername: () => Promise<void>;
	generatingUsername: boolean;
	bulkInput: string;
	setBulkInput: (value: string) => void;
	showBulkInput: boolean;
	setShowBulkInput: (show: boolean) => void;
	parseAndFillFields: (inputString: string) => void;
}

const ProfileFormScreen = ({
	formData,
	handleChange,
	handleSubmit,
	isLoading,
	profileSaved,
	userId,
	connectionUserId,
	setConnectionUserId,
	connectionUserIdError,
	setConnectionUserIdError,
	contactInfo,
	setContactInfo,
	contactError,
	setContactError,
	generateUsername,
	generatingUsername,
	bulkInput,
	setBulkInput,
	showBulkInput,
	setShowBulkInput,
	parseAndFillFields,
}: ProfileFormScreenProps) => {
	return (
		<div className="h-full flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="h-screen flex flex-col max-w-7xl mx-auto w-full animate-gradient-x px-4"
			>
				<motion.form
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					onSubmit={handleSubmit}
					className="flex-grow flex flex-col"
				>
					<Card className="shadow-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-md flex flex-col h-full max-h-[calc(100vh-4rem)] rounded-xl overflow-hidden">
						<CardContent className="p-6 md:p-8 flex-1 flex flex-col min-h-0">
							{/* Header */}
							<div className="text-center mb-6 flex flex-col items-center justify-center">
								<div className="relative inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full border border-blue-600/40 backdrop-blur-sm shadow-inner mb-2 animate-fade-in">
									<span className="text-sm md:text-base font-medium text-blue-300">
										✨ Powered by Claude ✨
									</span>
								</div>
								<h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-heading">
									Build Your Taste Profile
								</h2>
								<p className="text-sm text-slate-400 mt-1">
									Share your interests to help us find your perfect connections.
								</p>
							</div>

							{/* Scrollable Section */}
							<div className="flex-1 overflow-y-auto pr-1 min-h-0 max-h-[calc(100vh-400px)]">
								{/* Quick Fill */}
								<div className="mb-6 border-b border-slate-600 pb-6">
									<div className="flex items-center justify-between mb-3">
										<h3 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
											<span className="text-base">⚡</span>
											Quick Fill
										</h3>
										<button
											type="button"
											onClick={() => setShowBulkInput(!showBulkInput)}
											className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
										>
											{showBulkInput ? "Hide" : "Show"} Bulk Input
										</button>
									</div>

									{showBulkInput && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											className="space-y-3"
										>
											<p className="text-xs text-slate-400">
												Paste values separated by semicolons (;) to auto-fill
												all fields. Format:
												artist1,artist2;album1,album2;book1,book2;...;contact;username
											</p>
											<textarea
												value={bulkInput}
												onChange={(e) => setBulkInput(e.target.value)}
												placeholder="Enter semicolon-separated values..."
												className="w-full h-24 p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											/>
											<div className="flex gap-2 mt-2">
												<button
													type="button"
													onClick={() => parseAndFillFields(bulkInput)}
													disabled={!bulkInput.trim()}
													className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
												>
													Parse & Fill Fields
												</button>
												<button
													type="button"
													onClick={() => {
														setBulkInput("");
														setShowBulkInput(false);
													}}
													className="px-3 py-1.5 text-xs text-slate-300 bg-slate-600 rounded-md hover:bg-slate-700 transition"
												>
													Clear
												</button>
											</div>
										</motion.div>
									)}
								</div>

								{/* Interest Inputs */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4 pr-1">
									{QLOO_TYPES.map((type, index) => (
										<motion.div
											key={type}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.4 + index * 0.03, duration: 0.4 }}
											className="space-y-2 group bg-slate-700/40 border border-slate-600 rounded-md p-2 hover:bg-slate-700 transition"
										>
											<Label
												htmlFor={type}
												className="capitalize text-xs font-medium text-slate-300 flex items-center gap-1 group-hover:text-blue-400 transition-colors"
											>
												<motion.span
													initial={{ rotate: 0 }}
													whileHover={{ rotate: 20 }}
													transition={{ type: "spring", stiffness: 200 }}
												>
													{getTypeEmoji(type)}
												</motion.span>
												{type.replace("_", " ")}
											</Label>
											<ChipInput
												id={type}
												placeholder={`e.g. ${getPlaceholder(type)}`}
												values={formData[type] || []}
												onChange={(values) => handleChange(type, values)}
											/>
										</motion.div>
									))}
								</div>
							</div>

							{/* Footer: Contact + Username + CTA */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.8, duration: 0.4 }}
								className="text-center mt-4 pt-4 border-t border-slate-700 flex-shrink-0"
							>
								<div className="mb-4 max-w-2xl mx-auto">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<Label
												htmlFor="contactInfo"
												className="text-xs font-medium text-slate-300 mb-1 block"
											>
												Contact Info (Email or Phone)
											</Label>
											<Input
												id="contactInfo"
												type="text"
												placeholder="email@example.com or (555) 123-4567"
												value={contactInfo}
												onChange={(e) => {
													setContactInfo(e.target.value);
													setContactError("");
												}}
												className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
												disabled={isLoading || generatingUsername}
											/>
											{contactError && (
												<p className="text-red-400 text-xs mt-1">
													{contactError}
												</p>
											)}
										</div>
										<div>
											<Label
												htmlFor="connectionUserId"
												className="text-xs font-medium text-slate-300 mb-1 block"
											>
												Enter Username to Find Connections
											</Label>
											<div className="relative flex gap-2">
												<Input
													id="connectionUserId"
													type="text"
													placeholder="Enter username..."
													value={connectionUserId}
													onChange={(e) => {
														setConnectionUserId(e.target.value);
														setConnectionUserIdError("");
													}}
													className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10"
													disabled={isLoading || generatingUsername}
												/>
												<Button
													type="button"
													onClick={generateUsername}
													disabled={isLoading || generatingUsername}
													className="px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
													title="Generate username from interests"
												>
													{generatingUsername ? (
														<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
													) : (
														"✨"
													)}
												</Button>
											</div>
											{connectionUserIdError && (
												<p className="text-red-400 text-xs mt-1">
													{connectionUserIdError}
												</p>
											)}
										</div>
									</div>
								</div>

								<Button
									type="submit"
									size="lg"
									disabled={
										isLoading || !connectionUserId.trim() || generatingUsername
									}
									className="px-6 py-2.5 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg text-white disabled:opacity-50 transition-transform transform hover:scale-105 active:scale-95"
								>
									{isLoading ? (
										<>
											<motion.div
												animate={{ rotate: 360 }}
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: "linear",
												}}
												className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
											/>
											Creating Your Profile...
										</>
									) : profileSaved ? (
										<>Profile Saved! View Results ✨</>
									) : (
										<>Find My Connections ✨</>
									)}
								</Button>
								{userId && (
									<p className="text-xs text-slate-400 mt-2">
										Your profile ID: {userId}
									</p>
								)}
							</motion.div>
						</CardContent>
					</Card>
				</motion.form>
			</motion.div>
		</div>
	);
};
