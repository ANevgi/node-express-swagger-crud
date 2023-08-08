import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI } from "langchain";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CSVLoader } from "langchain/document_loaders/fs/csv"
import { BufferMemory } from "langchain/memory";
// import { PineconeClient } from "@pinecone-database/pinecone";
// import { PineconeStore } from "langchain/vectorstores/pinecone";
import fs from 'fs';
import 'dotenv/config';

// Global variables

let chain;
let chatHistory = [];

const openAIKey = process.env.OPENAI_API_KEY;
console.log(openAIKey);

export async function initialize(req, res) {

  try {
    const {userID, conversationID} = req.body;
    console.log(userID, conversationID);

    // Then if it's the first message, we want to initialize the chain, since it doesn't exist yet

    const initialPrompt = `You are the best customer assistant for people looking to find information about different recipes by ASDA. If the user asks how for a recipe, you should never give the link but explain the instructions instead. The user asks: 'Hi, how can you help me?'.`;
    
    chatHistory.push({
      role: "user",
      content: initialPrompt
    });

    const model = new ChatOpenAI({
      temperature: 0.3, // 0 = not creative, 1 = very creative
      modelName: "gpt-3.5-turbo"
    });
    
    // Load from CSV (replace path)
    const csvPath = './data/csvrecipetest.csv';
    const loader = new CSVLoader(csvPath);
    const docs = await loader.load();
    console.log(docs);
    
    // HNSWLib
    // Create embeddings
    const vectorStore = await HNSWLib.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
    );
    
    // Save embeddings
    //const dir = "/Users/arynevgi/Desktop/LangChainCourse/openai-javascript-course/";
    // await vectorStore.save(dir);

    // Load embeddings
    // const vectorStore = await HNSWLib.load(
    //   dir,
    //   new OpenAIEmbeddings()
    // );

    chain = ConversationalRetrievalQAChain.fromLLM( // role is human and prompt is to use context to answer question at the end and not to make up an answer if you don't know
      model,
      vectorStore.asRetriever(),
      { verbose: true,
      memory: new BufferMemory({
        memoryKey: "chat_history",
      })}
    );

    const response = chain.call({
      question: initialPrompt,
      //chat_history: chatHistory
    });

    chatHistory.push({
      role: "assistant",
      content: response.text
    });

    console.log('response returned');
    // And then we'll just get the response back and the chatHistory
    return res.status(200).json({ output: response, chatHistory });
  
    } catch (error) {
      console.error(error);
    }
}

export async function handler(req, res) {
  if (req.method === "POST") {

    const {prompt, userID, conversationID} = req.body;
    console.log(prompt, userID, conversationID);
      // If it's not the first message, we can chat with the bot

      try {

        chatHistory.push({
          role: "user",
          content: prompt
        })
  
        const response = await chain.call({
          question: prompt,
        })

        chatHistory.push({
          role: "assistant",
          content: response.text
        });

        return res.status(200).json({ output: response, chatHistory });
      } catch (error) {
        // Generic error handling
        console.error(error);
        res
          .status(500)
          .json({ error: "An error occurred during the conversation." });
      }
    }
  }

