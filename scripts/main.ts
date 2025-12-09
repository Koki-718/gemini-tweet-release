import { GoogleGenerativeAI } from '@google/generative-ai';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

// --- Configuration ---
let GEMINI_API_KEY = core.getInput('gemini_api_key');

if (!GEMINI_API_KEY) {
    // Fallback: try reading from env var directly (sometimes helpful in weird contexts, though inputs are standard)
    GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
}

if (!GEMINI_API_KEY) {
    core.setFailed('Error: GEMINI_API_KEY input is missing or empty. Please ensure the secret is set in Settings > Secrets and Variables > Actions.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function main() {
    try {
        // Get commit info
        const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
        const commitHash = execSync('git log -1 --pretty=%h').toString().trim();

        console.log(`Analyzing commit: ${commitHash}`);
        console.log(`Message: ${commitMessage}`);

        // 1. Generate Tweet Text
        const textModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

        const textPrompt = `
        あなたは親しみやすい広報担当エンジニアです。
        以下のコミットメッセージに基づいて、Twitter（X）に投稿するためのリリースツイートを作成してください。

        # コミットメッセージ
        ${commitMessage}

        # 構成（以下の順序で記述）
        1. **解説**: 何を実装・修正したか（技術的な視点も少し交えて）
        2. **結果**: それによってユーザー体験や開発体験がどう良くなったか
        3. **感想**: 実装してみての個人的な感想や、開発のワクワク感

        # 制約事項
        - 全体で3〜4文程度にまとめてください（長すぎないこと）。
        - 日本語で記述してください。
        - **丁寧語（です・ます調）**を使用し、「〜しました！」「〜ですね✨」のような柔らかい口調で。
        - 適切な絵文字（🚀, 🛠️, ✨, 💡など）を自然に使用してください。
        - ハッシュタグ #個人開発 #エンジニア を末尾に追加してください。
        - URLは含めないでください。
        - 出力はツイート本文のみにしてください。
        `;

        const result = await textModel.generateContent(textPrompt);
        const tweetText = result.response.text().trim();

        console.log('\n--- Generated Tweet ---');
        console.log(tweetText);

        // 2. Output (Intent URL & Summary)
        const encodedText = encodeURIComponent(tweetText);
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

        if (process.env.GITHUB_STEP_SUMMARY) {
            let summary = `
## 🚀 Tweet Draft Generated!

Gemini has created a tweet for commit \`${commitHash}\`.

### 📝 Content
> ${tweetText.replace(/\n/g, '<br>')}

### 👇 Action
[**Post to Twitter (Text Only)**](${intentUrl})
`;
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        } else {
            console.log(`\nTweet URL: ${intentUrl}`);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

main();
