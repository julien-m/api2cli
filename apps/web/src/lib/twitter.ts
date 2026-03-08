import { TwitterApi } from "twitter-api-v2";

const twitterClient =
  process.env.TWITTER_API_KEY &&
  process.env.TWITTER_API_SECRET &&
  process.env.TWITTER_ACCESS_TOKEN &&
  process.env.TWITTER_ACCESS_TOKEN_SECRET
    ? new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      })
    : null;

export async function tweetNewCLI(cli: {
  name: string;
  description: string;
}) {
  if (process.env.NODE_ENV !== "production") return;
  if (!twitterClient) return;

  const tweet = `🆕 New CLI published: ${cli.name}
${cli.description}

npx api2cli install ${cli.name}

#api2cli #devtools`;

  try {
    await twitterClient.v2.tweet(tweet);
  } catch (error) {
    console.error("Tweet failed (non-blocking):", error);
  }
}
