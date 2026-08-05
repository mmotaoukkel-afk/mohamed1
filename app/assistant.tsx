import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAssistantContext } from '../src/assistant/context/AssistantProvider';

export default function AssistantPageRoute() {
  const router = useRouter();
  const { triggerAssistant } = useAssistantContext();

  useEffect(() => {
    // Replace the route with home immediately
    router.replace('/');
    // Trigger the overlay on top of the home screen
    setTimeout(() => {
      triggerAssistant();
    }, 100);
  }, []);

  return null;
}
