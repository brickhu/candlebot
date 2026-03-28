import * as i18n from "@solid-primitives/i18n";
import en from "./en.json"
import zh from "./zh.json"
import { createSignal,createMemo,createEffect, createRoot } from "solid-js";
import { createStore } from "solid-js/store";


export const {locale, setLocale, locales,dictionarys,setDictionarys,dict,t} =  createRoot(()=>{

  const lang = navigator.language||navigator.userLanguage


  const locales = {
    en: {name:"English",dict:en},
    zh: {name:"繁體中文",dict:zh}
  };

  const [locale, setLocale] = createSignal(localStorage?.getItem("CURRENT_LOCALE") || lang&&(lang?.substr(0, 2)=="zh"?"zh":"en") || "en");

  const [dictionarys,setDictionarys] = createStore({zh:{},en:{}})


  const dict = createMemo(()=>({
    ...i18n.prefix(i18n.flatten(locales[locale()=="zh"?"zh":"en"]?.dict), "common"),
    ...i18n.flatten(dictionarys[locale()=="zh"?"zh":"en"])
  }))


  const t = i18n.translator(dict, i18n.resolveTemplate);

  createEffect(()=>{
    localStorage.setItem("CURRENT_LOCALE",locale())
  })

  return ({
    locale, setLocale,locales, dictionarys,setDictionarys,dict,t
  })
  
})