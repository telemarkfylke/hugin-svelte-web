<script>
  import "../app.css"; // Add global css (and make it hot reload)
  import logoTFK from "$lib/images/TFK_logo.png";
  import logoVFK from "$lib/images/VFK_logo.png";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getMsalClient, login, logout } from "../lib/auth/msal-auth";
  import { getHuginToken } from "../lib/useApi";
  import IconSpinner from "../lib/components/IconSpinner.svelte";

  let logo = ""
  if(import.meta.env.VITE_COUNTY === 'Telemark') {
    logo = logoTFK
  } else {
    logo = logoVFK
  }

  const appName = import.meta.env.VITE_APP_NAME

  // Variabel som får "kontoobjektet" fra innlogget bruker fra MSAL
  let account = null;

  onMount(() => {
    const authenticate = async () => {
      const msalClient = await getMsalClient();
      if (msalClient.getActiveAccount()) {
        account = msalClient.getActiveAccount();
        // console.log(await getHuginToken(true));
      }
      if (!account) {
        const loginResponse = await login(false, $page.url.pathname); // Sends you to ms auth, and redirects you back here with the msalClient set with active account
        account = loginResponse.account;
        if ($page.url.pathname !== loginResponse.loginRequestUrl) {
          goto(loginResponse.loginRequestUrl, {
            replaceState: false,
            invalidateAll: true,
          });
        }
      }
    };

    authenticate();

    return () => {
      // console.log("Destroyyyy");
      // on destroy (probs just wipe state)
    };
  });
</script>

<!-- Overwrite the title fraom app.html file -->
<svelte:head>
  <title>{appName}</title>
</svelte:head>

<!-- If the account is not loaded, show a loading message. -->
{#if !account}
  <div class="loading">
    <IconSpinner width={"32px"} />
  </div>
{:else}
  {#await getHuginToken(true)}
    <div class="loading">
      <IconSpinner width={"32px"} />
    </div> 
  {:then}
    <div class="topbar">
      <div class="toptop">
        <div>
          <a href="/"><img class="logo" src={logo} alt="Hugin og Munin" style="margin-right: 50px;"/></a>
        </div>
        <a href="/" title="Gå til forsiden" class="appTitle"><h1>{ appName }</h1></a>
        <div class="topbarOptions">
          <button class="link" on:click={() => { goto("/") }}>
            <span class="material-symbols-outlined">logout</span>Hjem / Logg ut</button>
          <button class="link" on:click={() => { goto("/homeSchool") }}><span class="material-symbols-outlined">chat</span>{appName}</button>
        </div>
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
    <div class="footer"></div>
  {/await}
{/if}

<style>
  .appTitle {
    color: black;
    text-decoration: none;
  }
  .topbar {
    width: 100%;
    background-color: var(--gress-10);
    padding: 20px 0px;
  }
  .toptop {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px 40px 40px;
  }
  .topbarOptions {
    float: right;
    display: flex;
    flex-direction: column;
    align-items: self-end;
  }
  .logo {
    width: 180px;
  }
  .content {
    padding: 10px;
    margin: auto;
    max-width: 1440px;
  }
  
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media only screen and (max-width: 768px) {
    /* For mobile phones: */
    .topbar {
      padding: 5px 0px;
    }
    .toptop {
      padding: 5px;
    }
    .appTitle {
      display: none;
      font-size: 10px;
    }
    .logo {
      width: 92px;
    }
    .content {
      padding: 5px;
    }
  }
</style>
