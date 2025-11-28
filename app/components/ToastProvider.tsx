"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
};

export default ToastProvider;