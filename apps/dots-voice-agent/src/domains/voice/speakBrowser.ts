export function speakWithBrowser(
  text: string,
  bargeIn: boolean,
  lang?: string,
) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    if (bargeIn) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.04;
    utterance.pitch = 1.02;
    if (lang) {
      utterance.lang = lang;
      const match = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase()));
      if (match) {
        utterance.voice = match;
      }
    }
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
