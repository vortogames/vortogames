function makeAudioElement(srcs) {
    const audio = new Audio();
    audio.preload = 'auto';
    srcs.forEach(src => {
        const s = document.createElement('source');
        s.src = src;
        s.type = src.endsWith('.mp3') ? 'audio/mpeg' : 'audio/ogg';
        audio.appendChild(s);
    });
    return audio;
}

export function createAudioBank(SOUND_SOURCES) {
    const AUDIO_BANK = {};
    Object.entries(SOUND_SOURCES).forEach(([name, srcs]) => {
        AUDIO_BANK[name] = makeAudioElement(srcs);
    });
    return AUDIO_BANK;
}

// Play helper (clones so overlapping sounds work)
export function playSound(name, AUDIO_BANK, SOUND_VOLUME) {
    const base = AUDIO_BANK[name];
    if (!base) return;
    const el = base.cloneNode(true);
    el.volume = SOUND_VOLUME[name] ?? 1;
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
}