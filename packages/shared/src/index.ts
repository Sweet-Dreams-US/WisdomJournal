// Types — User
export type { User, UserProfile, SubscriptionTier } from "./types/user";

// Types — Question
export type {
  Question,
  QuestionCategory,
  QuestionDifficulty,
  EmotionalWeight,
  ExpectedResponseLength,
  DailyQuestionSet,
  DailyQuestionItem,
  QuestionFeedback,
} from "./types/question";

// Types — Response
export type {
  JournalResponse,
  ResponseCategory,
  ResponseEmbedding,
  InputMethod,
  ResponseContext,
  AiSentiment,
  CategoryTagSource,
} from "./types/response";

// Types — Group
export type {
  Group,
  GroupMember,
  GroupCategoryAccess,
  GroupAccessSummary,
  GroupType,
  GroupRole,
  GroupMemberStatus,
  TrustColor,
} from "./types/group";

// Types — Friend
export type {
  Friendship,
  FriendCategoryAccess,
  FriendAccessSummary,
  FriendProfile,
  FriendWithProfile,
  FriendshipStatus,
} from "./types/friend";

// Types — Category
export type { Category, Subcategory } from "./types/category";

// Types — Stats & Achievements
export type {
  StreakStats,
  CategoryStats,
  StreakHistory,
  EncyclopediaStats,
  CategoryBreakdown,
  Achievement,
  UserAchievement,
  AchievementType,
} from "./types/stats";

// Types — Query
export type { WisdomQuery } from "./types/query";

// Types — Notification
export type {
  Notification,
  NotificationPreferences,
  DeviceToken,
  NotificationType,
} from "./types/notification";

// Constants
export { APP_NAME, APP_DESCRIPTION, SUBSCRIPTION_TIERS, NAV_ITEMS } from "./constants/config";
export { CATEGORIES } from "./constants/categories";
export type { CategorySlug } from "./constants/categories";
