(function(){
  "use strict";

  const LOCAL_PAGE = /\.html(?:[?#].*)?$/i;
  let navigating = false;

  function isModifiedClick(event){
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  }

  function isSkippableHref(href){
    return !href
      || href.startsWith("#")
      || /^(mailto|tel|sms|javascript):/i.test(href);
  }

  function isLocalPageUrl(url){
    if(url.protocol === "file:"){
      return LOCAL_PAGE.test(url.pathname);
    }

    return (url.protocol === "http:" || url.protocol === "https:")
      && url.origin === window.location.origin
      && (LOCAL_PAGE.test(url.pathname) || url.pathname.endsWith("/Pace/"));
  }

  function getLocalTarget(anchor){
    const href = anchor.getAttribute("href");

    if(isSkippableHref(href)){
      return null;
    }

    try{
      const url = new URL(href, window.location.href);
      return isLocalPageUrl(url) ? url : null;
    }catch(error){
      return null;
    }
  }

  function samePage(target){
    return target.href === window.location.href;
  }

  function handleNavigation(event){
    if(event.defaultPrevented || event.button !== 0 || isModifiedClick(event)){
      return;
    }

    const anchor = event.target.closest?.("a[href]");

    if(!anchor || anchor.target && anchor.target !== "_self" || anchor.hasAttribute("download")){
      return;
    }

    const target = getLocalTarget(anchor);

    if(!target || samePage(target)){
      return;
    }

    event.preventDefault();

    if(navigating){
      return;
    }

    navigating = true;
    anchor.setAttribute("aria-busy","true");
    document.documentElement.classList.add("pace-is-navigating");
    window.location.assign(target.href);
  }

  function registerServiceWorker(){
    if(!("serviceWorker" in navigator) || window.location.protocol === "file:"){
      return;
    }

    navigator.serviceWorker
      .register("sw.js", { scope:"./" })
      .then(registration => registration.update())
      .catch(() => {});
  }

  document.addEventListener("click", handleNavigation, true);
  window.addEventListener("pageshow", () => {
    navigating = false;
    document.documentElement.classList.remove("pace-is-navigating");
  });
  window.addEventListener("load", registerServiceWorker);
})();
