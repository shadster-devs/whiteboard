import React from "react";
import "../styles/globals.scss";
import type { AppProps } from "next/app";
import {ThemeProvider, ToastProvider, useTheme} from 'shadster-ui' ;

export default function App({ Component, pageProps }: AppProps) {

  return (

      <ThemeProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
  );}
