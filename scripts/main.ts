import { GoogleGenerativeAI } from '@google/generative-ai';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const ENABLE_IMAGE_GENERATION = process.env.ENABLE_IMAGE_GENERATION === 'true'; // Set 'true' in GitHub Secrets/Vars to enable
// ---------------------

// Load environment variables locally
if (!process.env.CI) {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach((line) => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateImage(prompt: string): Promise<string | null> {
    if (!ENABLE_IMAGE_GENERATION) return null;

    console.log('🎨 Generating image with Imagen 3.0...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    const body = {
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1 }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.warn(`⚠️ Image generation failed: ${response.status} ${response.statusText}`);
            console.warn('Check if your API key supports Imagen 3.0 (beta).');
            return null;
        }

        const data = await response.json();
        // Assuming response format: { predictions: [ { bytesBase64Encoded: "..." } ] }
        // Note: Actual response format for Gemini API Imagen might vary, adding basic check
        const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.predictions?.[0]; // Adjust based on actual API

        if (base64Image && typeof base64Image === 'string') {
            return base64Image;
        }
        return null;
    } catch (error) {
        console.error('⚠️ Image generation error:', error);
        return null;
    }
}

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

        // 2. Generate Image (Optional)
        let imagePath = null;
        if (ENABLE_IMAGE_GENERATION) {
            // Generate prompt for image based on tweet text
            const imagePromptResult = await textModel.generateContent(`
                以下のツイート内容を表す、技術的でクールな、または親しみやすいイメージ画像のプロンプト（英語）を作成してください。
                Prompt only. No explanations.
                
                Tweet: ${tweetText}
            `);
            const imagePrompt = imagePromptResult.response.text().trim();
            console.log(`\nGenerated Image Prompt: ${imagePrompt}`);

            const base64Image = await generateImage(imagePrompt + ", high quality, 4k, tech style");
            if (base64Image) {
                imagePath = 'generated-image.png';
                fs.writeFileSync(imagePath, Buffer.from(base64Image, 'base64'));
                console.log(`✅ Image saved to ${imagePath}`);
            }
        }

        // 3. Output (Intent URL & Summary)
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
            if (imagePath) {
                summary += `
### 🖼️ Generated Image
An image has been generated! Check the **Artifacts** section of this workflow run to download \`generated-image.png\`.
*(Note: Twitter Intent URL does not support automatic image attachment. You must manually attach the downloaded image.)*
`;
            } else if (ENABLE_IMAGE_GENERATION) {
                summary += `
### 🖼️ Image Generation
Image generation was enabled but failed (or returned no data). Check logs for details.
`;
            }

            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        } else {
            console.log(`\nTweet URL: ${intentUrl}`);
            if (imagePath) console.log(`Image saved: ${imagePath}`);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

main();
