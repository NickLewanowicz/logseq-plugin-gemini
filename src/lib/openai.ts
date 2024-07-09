import {
  ChatCompletionRequestMessage,
} from "openai"
import "@logseq/libs"
import { GoogleGenerativeAI } from '@google/generative-ai'


export type DalleImageSize = 256 | 512 | 1024
export interface OpenAIOptions {
  apiKey: string
  completionEngine?: string
  temperature?: number
  maxTokens?: number
  dalleImageSize?: DalleImageSize
  chatPrompt?: string
}

const OpenAIDefaults = (apiKey: string): OpenAIOptions => ({
  apiKey,
  completionEngine: "gpt-3.5-turbo",
  temperature: 1.0,
  maxTokens: 1000,
  dalleImageSize: 1024,
})


export async function openAI(
  input: string,
  openAiOptions: OpenAIOptions
): Promise<string | null> {
  const options = { ...OpenAIDefaults(openAiOptions.apiKey), ...openAiOptions }


  const genAI = new GoogleGenerativeAI(options.apiKey)

  const model = genAI.getGenerativeModel({
    model: openAiOptions.completionEngine || 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: openAiOptions.maxTokens,
      temperature: openAiOptions.temperature
    }
  })

  try {
    const inputMessages: ChatCompletionRequestMessage[] = [{ role: "user", content: input }]
    if (openAiOptions.chatPrompt && openAiOptions.chatPrompt.length > 0) {
      inputMessages.unshift({ role: "system", content: openAiOptions.chatPrompt })

    }
    const result = await model.generateContent(input)
    return result.response.text()
  } catch (e: any) {
    if (e?.response?.data?.error) {
      console.error(e?.response?.data?.error)
      throw new Error(e?.response?.data?.error?.message)
    } else {
      throw e
    }
  }
}

export async function openAIWithStream(
  input: string,
  openAiOptions: OpenAIOptions,
  onContent: (content: string) => void,
  _onStop: () => void
): Promise<string | null> {

  const genAI = new GoogleGenerativeAI(openAiOptions.apiKey)

  const model = genAI.getGenerativeModel({
    model: openAiOptions.completionEngine || 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: openAiOptions.maxTokens,
      temperature: openAiOptions.temperature
    }
  })

  try {
    const inputMessages: ChatCompletionRequestMessage[] = [{ role: "user", content: input }]
    if (openAiOptions.chatPrompt && openAiOptions.chatPrompt.length > 0) {
      inputMessages.unshift({ role: "system", content: openAiOptions.chatPrompt })
    }
    const result = await model.generateContentStream(input)
    const response = await result.response
    console.log('text', response.text())

    for await (const chunk of result.stream) {
      onContent(chunk.text())
    }
    const final = (await result.response).text()
    return final
  } catch (e: any) {
    if (e?.response?.data?.error) {
      console.error(e?.response?.data?.error)
      throw new Error(e?.response?.data?.error?.message)
    } else {
      throw e
    }
  }
}
