
let audioInstances = {};
let isLoading = false;

const audioCtx = new window.AudioContext();
document.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});

async function playSong(name, onEndedCallback, volume = 1, speedValue = 1) {
    if (isLoading) return;

    songLoading();

    await createVoice(name);
    if (!audioInstances[name] || audioInstances[name] === "loading") return;

    songLoaded();

    let audio = audioInstances[name];

    playPauseMusicButton.textContent = '⏸️';

    pauseAllSongs();

    audio.setPlaybackRate(speedValue);
    audio.setVolume(volume);

    audio.play(onEndedCallback);
}

async function pauseSong(name) {
    if (!audioInstances[name] || audioInstances[name] === "loading") return;
    audioInstances[name].pause();

    playPauseMusicButton.textContent = '▶️';
}
async function stopSong(name) {
    if (!audioInstances[name] || audioInstances[name] === "loading") return;
    audioInstances[name].stop();

    playPauseMusicButton.textContent = '▶️';
}

async function setSongsVolume(volume) {
    for (const audioInstance of Object.keys(audioInstances)) {
        if (audioInstances[audioInstance] === "loading") continue;

        audioInstances[audioInstance].setVolume(volume);
    }
}

async function createVoice(name) {
    if (audioInstances[name]) return;
    audioInstances[name] = "loading";

    let source = musicBuffer[name];
    const gainNode = audioCtx.createGain();

    if (source.startsWith("data:")) {
        source = source.split(",")[1];
    }

    const binary = atob(source);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const buffer = await audioCtx.decodeAudioData(bytes.buffer);

    audioInstances[name] = {
        gainNode,
        volume: 1,
        playbackRate: 1,
        currentSourceNode: null,
        startedAt: 0,
        pausedAt: 0,

        setVolume: function (val) {
            this.gainNode.gain.value = val;
            this.volume = val;
        },
        setPlaybackRate: function (val) {
            this.playbackRate = val;
        },

        play: function (onEndedCallback) {
            if (this.currentSourceNode) {
                this.currentSourceNode.onended = null; // Désactive le callback du son précédent
                try { this.currentSourceNode.stop(); } catch { }
            }

            const sourceNode = audioCtx.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.playbackRate.value = this.playbackRate;
            sourceNode.connect(this.gainNode).connect(audioCtx.destination);

            const offset = this.pausedAt % buffer.duration;
            this.startedAt = audioCtx.currentTime - offset;
            sourceNode.start(0, offset);

            this.currentSourceNode = sourceNode;

            sourceNode.onended = () => {
                this.pausedAt = 0;
                if (onEndedCallback) onEndedCallback();
            };
        },

        pause: function () {
            if (this.currentSourceNode) {
                this.currentSourceNode.onended = null; // Empêche le callback de se déclencher
                try { this.currentSourceNode.stop(); } catch { }

                this.pausedAt = audioCtx.currentTime - this.startedAt;
                this.currentSourceNode = null;
            }
        },

        stop: function () {
            this.pause();
            this.pausedAt = 0;
        },
    };
}



const musicList = Object.keys(musicBuffer);
//Shuffle the list to always have differents entries orders
for (let i = musicList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [musicList[i], musicList[j]] = [musicList[j], musicList[i]];
}
let currentMusic = 0;
let isMusicPlaying = false;
let musicVolume = 1;

const previousTrackButton = document.querySelector('#previousTrack');
const playPauseMusicButton = document.querySelector('#playPauseMusic');
const nextTrackButton = document.querySelector('#nextTrack');
const musicVolumeSlider = document.querySelector('#musicVolumeSlider');
{
    musicVolumeSlider.min = 0;
    musicVolumeSlider.max = 100;
    musicVolumeSlider.step = 1;

    if (!localStorage.getItem('musicVolume')) localStorage.setItem('musicVolume', '75');
    musicVolume = parseInt(localStorage.getItem('musicVolume'));

    musicVolumeSlider.value = musicVolume;
}
const musicVolumeValue = document.querySelector('#musicVolumeValue');
{
    musicVolumeValue.textContent = `Volume: ${musicVolume}%`;
}

previousTrackButton.addEventListener('click', previousTrack);
playPauseMusicButton.addEventListener('click', playPauseMusic);
nextTrackButton.addEventListener('click', playNextSong);
musicVolumeSlider.addEventListener('input', () => {
    musicVolume = parseInt(musicVolumeSlider.value);

    setSongsVolume(musicVolume / 100);

    localStorage.setItem('musicVolume', musicVolume);

    musicVolumeValue.textContent = `Volume: ${musicVolume}%`;
});

function previousTrack() {
    const audioInstance = audioInstances[musicList[currentMusic]];

    const elapsedTime = (audioInstance && audioInstance !== "loading") ? audioCtx.currentTime - audioInstance.startedAt : 0;

    //If the elapsed time is lower than 4 seconds we play the previous song
    if (elapsedTime < 4) {
        stopSong(musicList[currentMusic]);

        currentMusic = (currentMusic - 1 + musicList.length) % musicList.length;
    }

    //Otherwise, we simply play the song again, which restarts it
    playThisSong(currentMusic);
}
function playPauseMusic() {
    if (isMusicPlaying) pauseSong(musicList[currentMusic]);
    else playThisSong(currentMusic);

    isMusicPlaying = !isMusicPlaying;
}
function playNextSong() {
    stopSong(musicList[currentMusic]);

    currentMusic = (currentMusic + 1) % musicList.length;

    playThisSong(currentMusic);
}
function playThisSong(index) {
    playSong(musicList[index], playNextSong, musicVolume / 100);
}


//A lot of methods to try stop the execution of the buttons while a song is loading
//It is to prevent my system to break and to anything...
//So I tried putting a boolean value to capteur a song loading which isn't useful since I now remove the Event Listeners
//But I kept all this attempts as security systems, "in case of"...
function songLoading() {
    //wait or progress are good cursors to ensure the user understands something is loading
    previousTrackButton.style.cursor = 'wait';
    playPauseMusicButton.style.cursor = 'wait';
    nextTrackButton.style.cursor = 'wait';

    isLoading = true;

    previousTrackButton.removeEventListener('click', previousTrack);
    playPauseMusicButton.removeEventListener('click', playPauseMusic);
    nextTrackButton.removeEventListener('click', playNextSong);
}
function songLoaded() {
    previousTrackButton.style.cursor = 'pointer';
    playPauseMusicButton.style.cursor = 'pointer';
    nextTrackButton.style.cursor = 'pointer';

    isLoading = false;

    previousTrackButton.addEventListener('click', previousTrack);
    playPauseMusicButton.addEventListener('click', playPauseMusic);
    nextTrackButton.addEventListener('click', playNextSong);
}

function pauseAllSongs() {
    for (const audioInstance of Object.keys(audioInstances)) {
        if (audioInstances[audioInstance] === "loading") return;

        audioInstances[audioInstance].stop();
    }
}
