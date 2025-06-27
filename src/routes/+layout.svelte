<script>
  import "../app.css"; // Add global css (and make it hot reload)
  import logoTFK from "$lib/images/TFK_logo.C1Rt3xma-h100.png";
  import logoTFK_mobile from "$lib/images/TFK_logo.C1Rt3xma-h50.png";
  import logoVFK from "$lib/images/VFK_logo.png";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getMsalClient, login/*, logout*/ } from "../lib/auth/msal-auth";
  import { getHuginToken } from "../lib/useApi";
  import IconSpinner from "../lib/components/IconSpinner.svelte";

  const { VITE_APP_NAME: appName, VITE_COUNTY: county } = import.meta.env
  
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();

  let logo = $state("");
  let logo_mobile = $state("");
  if (county === 'Telemark') {
    logo = logoTFK;
    logo_mobile = logoTFK_mobile;
  } else {
    logo = logoVFK;
    logo_mobile = logoVFK;
  }

  // Variabel som får "kontoobjektet" fra innlogget bruker fra MSAL
  let account = $state(null);

  onMount(() => {
    const authenticate = async () => {
      const msalClient = await getMsalClient();
      if (msalClient.getActiveAccount()) {
        account = msalClient.getActiveAccount();
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
    <IconSpinner width="32px" />
  </div>
{:else}
  {#await getHuginToken(true)}
    <div class="loading">
      <IconSpinner width="32px" />
    </div> 
  {:then _}
    <div class="topbar">
      <div class="toptop">
        <div>
            <a href="/"><img class="logo" src={logo} alt="{appName}" style="margin-right: 50px;" srcset="{logo_mobile} 768w, {logo} 769w"/></a>
        </div>
        <a href="/" title="Gå til forsiden" class="appTitle"><h1>{ appName }</h1></a>
        <div class="topbarOptions">
          <!-- logg ut fungerer ikke, Hjem er dekket av å trykker på header-tittel. Holder kanskje?-->
          <!--button class="link" on:click={() => { goto("/") }}>
            <span class="material-symbols-outlined">logout</span>Hjem / Logg ut</button>
          <button class="link" on:click={() => { goto("/homeSchool") }}><span class="material-symbols-outlined">chat</span>{appName}</button-->
        </div>
      </div>
    </div>
    <div class="content">
      {@render children?.()}
    </div>
    <!-- <div class="footer"></div> -->
  {/await}
{/if}

<style>
* {
  /* user-select:none; */
}
  .appTitle {
    color: black;
    text-decoration: none;
    flex-grow: 1;
    text-align: center;
  }
  .topbar {
    width: 100%;
    background-color: var(--gress-10);
    padding: 0px 0px;
  }
  .toptop {
    width: 100%;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 40px 10px 40px;
    position: relative;
  }
  .topbarOptions {
    display: flex;
    flex-direction: column;
    align-items: self-end;
  }
  .logo {
    width: 180px;
    margin-right: 50px;
    left: 40px;
    position: absolute;
    top: 10px;
  }
  .content {
    padding: 10px;
    margin: auto;
    max-width: 1000px;
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
      height: 50px;
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
      margin-right: 0;
      left: 5px;
    }
    .content {
      padding: 5px;
    }
  }
</style>
