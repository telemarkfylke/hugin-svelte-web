<script>
    import InfoBox from '$lib/components/InfoBox.svelte'
    import chat from '$lib/images/chat.png'
    import doc from '$lib/images/doc.png'
    import ravner from '$lib/images/ravner.jpg'
    import CardButton from '$lib/components/CardButton.svelte'
    import IconSpinner from '../lib/components/IconSpinner.svelte';
    import { getHuginToken } from '../lib/useApi';
    import { onMount } from 'svelte';
    
    let token = null
    const appName = import.meta.env.VITE_APP_NAME

    onMount(async () => {
        if(import.meta.env.VITE_MOCK_API && import.meta.env.VITE_MOCK_API === 'true'){
            // Pretend to wait for api call
            spinner = true
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
        token = await getHuginToken(true)
    })
  </script>
  
  <main>
    {#if !token}
      <div class="loading">
        <IconSpinner width={"32px"} />
      </div> 
    {:else}
      <div class="centerstuff">
          <h1>{appName} - En KI-tjeneste for {import.meta.env.VITE_COUNTY} fylkeskommune</h1>
      </div>
      <div class="centerstuff">
        <CardButton header={'Om tjenesten'} imgPath={ravner} imgAlt={'Bilde av Hugin og Munin'} gotoPath={'/about'} paragraph={'Trykk her for å lese mer om tjenesten'} boolValue={true}><span class="material-symbols-outlined">raven</span></CardButton>
        <CardButton header={'Chat'} imgPath={chat} imgAlt={'Ikon bilde av en snakkebobble'} gotoPath={'/homeSchool'} paragraph={'Trykk her for chatbotter'} boolValue={true}><span class="material-symbols-outlined">chat</span></CardButton>
        {#if token.roles.includes(`${appName.toLowerCase()}.admin`)}
          <CardButton header={'Dokumentspørring'} imgPath={doc} imgAlt={'Ikon bilde av et dokument'} gotoPath={'/docQuery'} paragraph={'Trykk her hvis du vil bruke KI til spørre og jobbe med egne dokumenter.'} boolValue={true}><span class="material-symbols-outlined">find_in_page</span></CardButton>
        {/if}
      </div>
    {/if}
  </main>
  
  
  <style>
  * {
    /* user-select:none; */
    }
    .centerstuff {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
    .material-symbols-outlined {
        font-size: 7.5rem;
        font-variation-settings:
            'FILL' 0,
            'wght' 400,
            'GRAD' 0,
            'opsz' 100
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
    }

      
  </style>