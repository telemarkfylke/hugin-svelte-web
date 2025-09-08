// Bibliotek for å håndtere API-kall til AZF-funksjoner
import axios from 'axios'
// import { models } from "$lib/data/models"; // Modellkonfigurasjon
import { getHuginToken } from '../useApi'
import { getArticlesFromNDLA, generateKeywords } from './kildekallTools'
import { studieledetekst } from '$lib/data/systemprompts' // Importer studiemodus fra data/systemprompts.js

const { VITE_AI_API_URI: aiApiUri } = import.meta.env

const getNDLAArticleUrls = (articles) => {
  let articleUrls = 'Les mer på NDLA om: '
  for (let i = 0; i < articles.length; i++) {
    const text = `[${articles[i].title.title}](https://ndla.no/article-iframe/nb/article/${articles[i].id})`

    if (i === 0) {
      articleUrls += `${text}`
      continue
    }

    if (i < (articles.length - 1)) {
      articleUrls += `, ${text}`
      continue
    }

    articleUrls += `, og ${text}`
  }

  return articleUrls
}

export const responseOpenAi = async (userParams) => {
  const accessToken = await getHuginToken()
  const payload = {
    userMessage: userParams.message,
    response_id: userParams.response_id,
    imageBase64: userParams.imageB64,
    dokFiles: userParams.dokFiles,
    model: userParams.model,
    studiemodus: userParams.studiemodus, // Legg til studiemodus i payload
    isFirstPrompt: userParams.isFirstPrompt, // Legg til isFirstPrompt i payload
    kontekst: userParams.kontekst
  }

  // Legg til kontekst før første prompt
  if (payload.kontekst && payload.isFirstPrompt) {
    payload.userMessage = `${payload.kontekst}\n\n${payload.userMessage}`
  }

  // Hvis studiemodus legg til ledetekst to payload brukerinputten
  if (payload.studiemodus && payload.isFirstPrompt) {
    payload.userMessage = `${studieledetekst.ledetekst}\n\n${payload.userMessage}`
  }

  console.log('Response OpenAI - Payload:', payload.userMessage)

  const response = await axios.post(`${aiApiUri}/responseOpenAi`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  return response
}

export const openAiAssistant = async (userParams) => {
  const payload = {
    assistant_id: userParams.assistant_id,
    new_thread: userParams.new_thread,
    thread_id: userParams.thread_id,
    messageHistory: userParams.messageHistory,
    tile: userParams.tile
  }
  const accessToken = await getHuginToken()
  const { data } = await axios.post(`${aiApiUri}/assistantOpenAi`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })

  if (userParams.tools === 'NDLA') {
    console.log('Assistant - Using NDLA tool')
    const keyWords = await generateKeywords(data.messages[0].content[0].text.value)
    const articles = await getArticlesFromNDLA(keyWords)
    const articleUrls = getNDLAArticleUrls(articles)

    return [data, articleUrls]
  }

  console.log('Assistant - No tool')
  return [data, false]
}

export const docQueryOpenAi = async (userParams) => {
  const accessToken = await getHuginToken()

  const formData = new FormData()
  formData.append('assistant_id', userParams.assistant_id)
  formData.append('response_id', userParams.response_id)
  formData.append('thread_id', userParams.thread_id)
  formData.append('new_thread', userParams.new_thread)
  formData.append('vectorStore_id', userParams.vectorStore_id)
  formData.append('userMessage', userParams.message)
  formData.append('messageHistory', JSON.stringify(userParams.messageHistory))

  if (userParams.dokFiles && userParams.dokFiles.length > 0) {
    for (let i = 0; i < userParams.dokFiles.length; i++) {
      formData.append('filer', userParams.dokFiles[i])
    }
  }

  const payload = formData

  const response = await axios.post(`${aiApiUri}/docQueryOpenAiV2`, payload, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })
  return response.data
}

export const streamResponseOpenAi = async (userParams) => {
  const accessToken = await getHuginToken()

  const payload = {
    messages: userParams.messages,
    model: userParams.model || 'gpt-4.1',
    stream: true,
    studiemodus: userParams.studiemodus,
    isFirstPrompt: userParams.isFirstPrompt,
    kontekst: userParams.kontekst
  }

  if (userParams.studiemodus) {
    payload.messages[0] = {
      role: 'developer',
      content: studieledetekst.ledetekst + '\n\n' + userParams.kontekst
    }
  } else {
    payload.messages[0] = {
      role: 'developer',
      content: userParams.kontekst
    }
  }

  const response = await fetch(`${aiApiUri}/streamResponseOpenAi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}
