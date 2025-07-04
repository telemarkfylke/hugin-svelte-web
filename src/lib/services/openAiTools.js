// Bibliotek for å håndtere API-kall til AZF-funksjoner
import axios from 'axios'
// import { models } from "$lib/data/models"; // Modellkonfigurasjon
import { getHuginToken } from '../useApi'
import { getArticlesFromNDLA, generateKeywords } from './kildekallTools'

const { VITE_AI_API_URI: aiApiUri } = import.meta.env

const getNDLAArticleUrls = (articles) => {
  let articleUrls = 'Les mer på NDLA om: '
  for (let i= 0; i < articles.length; i++) {
    const text = `[${articles[i].title.title}](https://ndla.no/article-iframe/nb/article/${articles[i].id})`

    if (i === 0) {
      articleUrls += `${text}`
      continue;
    }

    if (i < (articles.length - 1)) {
      articleUrls += `, ${text}`
      continue;
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
    model: userParams.model
  }

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
