/**
 * @name CreamySound
 * @author Kotsutsu
 * @version 1.1.0
 * @description PLays creamy typing sounds when you type in Discord.
 * @source https://github.com/Kotsutsu/CreamySound
 */

module.exports = class CreamySound {
    constructor() {
        this.listener = this.onKeyDown.bind(this);

        this.settings = {
            volume: 0.2,
            cooldown: 20,
            onlyInTextInputs: true,
            playOnRepeat: false
        };

        this.lastPlay = 0;

        this.sounds = {
            letters: [],
            enter: null,
            backspace: null,
            space: null
        };

        this.baseUrl = "https://raw.githubusercontent.com/Kotsutsu/CreamySound/main/sounds";
    }

    start() {
        try {
            this.loadSounds();
            document.addEventListener("keydown", this.listener, true);

            BdApi.UI.showToast("CreamySound activé.", { type: "success" });
            console.log("[CreamySound] Plugin démarré.");
        } catch (err) {
            console.error("[CreamySound] Erreur au démarrage :", err);
            BdApi.UI.showToast("CreamySound : erreur au démarrage.", { type: "error" });
        }
    }

    stop() {
        document.removeEventListener("keydown", this.listener, true);
        this.unloadSounds();

        BdApi.UI.showToast("CreamySound désactivé.", { type: "info" });
        console.log("[CreamySound] Plugin arrêté.");
    }

    unloadSounds() {
        const allSounds = [
            ...this.sounds.letters,
            this.sounds.enter,
            this.sounds.backspace,
            this.sounds.space
        ].filter(Boolean);

        for (const sound of allSounds) {
            try {
                sound.pause();
                sound.src = "";
            } catch (_) {}
        }

        this.sounds = {
            letters: [],
            enter: null,
            backspace: null,
            space: null
        };
    }

    createAudio(fileName) {
        const audio = new Audio(`${this.baseUrl}/${fileName}`);
        audio.volume = this.settings.volume;
        audio.preload = "auto";

        audio.addEventListener("error", () => {
            console.warn(`[CreamySound] Impossible de charger le son : ${fileName}`);
        });

        return audio;
    }

    loadSounds() {
        this.sounds.letters = [
            this.createAudio("letter_1.wav"),
            this.createAudio("letter_2.wav"),
            this.createAudio("letter_3.wav")
        ];

        this.sounds.enter = this.createAudio("enter.wav");
        this.sounds.backspace = this.createAudio("backspace.wav");
        this.sounds.space = this.createAudio("space.wav");

        console.log("[CreamySound] Sons distants chargés :", {
            letters: this.sounds.letters.length,
            enter: !!this.sounds.enter,
            backspace: !!this.sounds.backspace,
            space: !!this.sounds.space
        });
    }

    isTypingTarget(target) {
        if (!target) return false;
        if (target.tagName === "TEXTAREA") return true;
        if (target.tagName === "INPUT") return true;
        if (target.isContentEditable) return true;

        return !!target.closest?.('[contenteditable="true"], textarea, input');
    }

    shouldIgnoreKey(e) {
        const ignored = [
            "Shift",
            "Control",
            "Alt",
            "Meta",
            "CapsLock",
            "Tab",
            "Escape",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            "Insert",
            "NumLock",
            "ScrollLock",
            "Pause",
            "PrintScreen",
            "ContextMenu"
        ];

        if (ignored.includes(e.key)) return true;
        if (e.ctrlKey || e.altKey || e.metaKey) return true;
        if (e.repeat && !this.settings.playOnRepeat) return true;

        return false;
    }

    getSoundForKey(key) {
        if (key === "Enter") return this.sounds.enter;
        if (key === "Backspace") return this.sounds.backspace;
        if (key === " ") return this.sounds.space;

        if (!this.sounds.letters.length) return null;

        const randomIndex = Math.floor(Math.random() * this.sounds.letters.length);
        return this.sounds.letters[randomIndex];
    }

    playSound(audio) {
        if (!audio) return;

        const now = Date.now();
        if (now - this.lastPlay < this.settings.cooldown) return;
        this.lastPlay = now;

        try {
            const clone = audio.cloneNode();
            clone.volume = this.settings.volume;
            clone.play().catch(err => {
                console.warn("[CreamySound] Impossible de jouer le son :", err);
            });
        } catch (err) {
            console.error("[CreamySound] Erreur pendant la lecture :", err);
        }
    }

    onKeyDown(e) {
        try {
            if (this.settings.onlyInTextInputs && !this.isTypingTarget(e.target)) return;
            if (this.shouldIgnoreKey(e)) return;

            const sound = this.getSoundForKey(e.key);
            this.playSound(sound);
        } catch (err) {
            console.error("[CreamySound] Erreur onKeyDown :", err);
        }
    }
};