const audio = document.querySelector("#audio-element");

if (audio) {
  const playerPlay = document.querySelector("#player-play");
  const playerTitle = document.querySelector("#player-title");
  const playerCover = document.querySelector("#player-cover");
  const expandedCover = document.querySelector("#expanded-cover");
  const expandedTitle = document.querySelector("#expanded-title");
  const playerStatus = document.querySelector("#player-status");
  const seekBar = document.querySelector("#seek-bar");
  const expandedSeekBar = document.querySelector("#expanded-seek-bar");
  const volumeRange = document.querySelector("#volume-range");
  const expandedVolumeRange = document.querySelector("#expanded-volume-range");
  const volumeToggles = [
    document.querySelector("#volume-toggle"),
    document.querySelector("#expanded-volume-toggle"),
  ];
  const repeatButtons = [
    document.querySelector("#repeat-track"),
    document.querySelector("#expanded-repeat-track"),
  ];
  const shuffleButtons = [
    document.querySelector("#shuffle-tracks"),
    document.querySelector("#expanded-shuffle-tracks"),
  ];
  const currentTimeLabel = document.querySelector("#current-time");
  const durationLabel = document.querySelector("#duration-time");
  const expandedCurrentTimeLabel = document.querySelector("#expanded-current-time");
  const expandedDurationLabel = document.querySelector("#expanded-duration-time");
  const expandedPlayerPlay = document.querySelector("#expanded-player-play");
  const fullPlayer = document.querySelector("#now-playing");
  const openFullPlayer = document.querySelector("#open-full-player");
  let cards = [];
  let tracks = [];
  let currentTrackIndex = -1;
  let currentTrack = null;
  let playbackRequestId = 0;
  let lastVolume = audio.volume || 1;
  let repeatTrack = false;
  let shuffleEnabled = false;
  let shuffleOrder = [];
  let shufflePosition = -1;

  function updatePlaybackModes() {
    repeatButtons.forEach((button) => {
      button.classList.toggle("is-active", repeatTrack);
      button.setAttribute("aria-pressed", String(repeatTrack));
      button.setAttribute("aria-label", repeatTrack ? "Turn off repeat track" : "Repeat current track");
      button.title = repeatTrack ? "Repeat track: on" : "Repeat track: off";
    });
    shuffleButtons.forEach((button) => {
      button.classList.toggle("is-active", shuffleEnabled);
      button.setAttribute("aria-pressed", String(shuffleEnabled));
      button.setAttribute("aria-label", shuffleEnabled ? "Turn off shuffle" : "Shuffle tracks");
      button.title = shuffleEnabled ? "Shuffle: on" : "Shuffle: off";
    });
  }

  function makeShuffleOrder(startIndex = currentTrackIndex) {
    shuffleOrder = tracks.map((_, index) => index);
    for (let index = shuffleOrder.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffleOrder[index], shuffleOrder[randomIndex]] = [shuffleOrder[randomIndex], shuffleOrder[index]];
    }
    shufflePosition = shuffleOrder.indexOf(startIndex);
    if (shufflePosition > 0) {
      [shuffleOrder[0], shuffleOrder[shufflePosition]] = [shuffleOrder[shufflePosition], shuffleOrder[0]];
      shufflePosition = 0;
    }
  }

  function getAdjacentTrack(direction) {
    if (currentTrackIndex < 0 || !tracks.length) return -1;
    if (!shuffleEnabled) return (currentTrackIndex + direction + tracks.length) % tracks.length;
    if (shuffleOrder.length !== tracks.length) makeShuffleOrder();
    shufflePosition = shuffleOrder.indexOf(currentTrackIndex);
    if (shufflePosition < 0) {
      makeShuffleOrder();
      shufflePosition = 0;
    }
    shufflePosition = (shufflePosition + direction + shuffleOrder.length) % shuffleOrder.length;
    return shuffleOrder[shufflePosition];
  }

  function updateVolumeControls() {
    const isMuted = audio.muted || audio.volume === 0;
    const volume = isMuted ? 0 : audio.volume;
    volumeRange.value = volume;
    expandedVolumeRange.value = volume;
    volumeRange.style.setProperty("--volume-level", `${volume * 100}%`);
    expandedVolumeRange.style.setProperty("--volume-level", `${volume * 100}%`);
    volumeToggles.forEach((button) => {
      button.classList.toggle("is-muted", isMuted);
      button.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
      button.setAttribute("aria-pressed", String(isMuted));
    });
  }

  function setVolume(value) {
    const volume = Math.min(1, Math.max(0, Number(value)));
    audio.volume = volume;
    audio.muted = false;
    if (volume > 0) lastVolume = volume;
    updateVolumeControls();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }

  function bindPageCards() {
    cards = [...document.querySelectorAll(".beat-card")];
    const previousTrackCount = tracks.length;
    cards.forEach((card) => {
      const track = {
        title: card.dataset.title,
        src: card.dataset.src,
        cover: card.querySelector(".beat-art img")?.src || "",
        alt: card.querySelector(".beat-art img")?.alt || `${card.dataset.title} cover art`,
      };
      const existingIndex = tracks.findIndex((item) => item.title === track.title);
      if (existingIndex < 0) tracks.push(track);
      else tracks[existingIndex] = track;
    });

    if (currentTrack) {
      const index = tracks.findIndex((track) => track.title === currentTrack.title);
      if (index >= 0) currentTrackIndex = index;
    }
    if (shuffleEnabled && tracks.length !== previousTrackCount) makeShuffleOrder();
    updatePlayButtons();
  }

  function updatePlayButtons() {
    cards.forEach((card) => {
      const isPlaying = currentTrack?.title === card.dataset.title && !audio.paused;
      card.classList.toggle("is-playing", isPlaying);
      card.querySelector(".card-play")?.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} ${card.dataset.title}`);
    });
    const isPlaying = Boolean(currentTrack) && !audio.paused;
    playerPlay.classList.toggle("is-playing", isPlaying);
    playerPlay.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
    expandedPlayerPlay.classList.toggle("is-playing", isPlaying);
    expandedPlayerPlay.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  }

  function loadTrack(index) {
    const track = tracks[index];
    if (!track) return;
    playbackRequestId += 1;
    audio.pause();
    currentTrackIndex = index;
    currentTrack = track;
    if (shuffleEnabled) {
      const position = shuffleOrder.indexOf(index);
      if (position < 0) makeShuffleOrder(index);
      else shufflePosition = position;
    }
    audio.src = track.src;
    playerTitle.textContent = track.title;
    expandedTitle.textContent = track.title;
    if (track.cover) {
      playerCover.src = track.cover;
      playerCover.alt = track.alt;
      expandedCover.src = track.cover;
      expandedCover.alt = track.alt;
    }
    playerPlay.disabled = false;
    expandedPlayerPlay.disabled = false;
    openFullPlayer.disabled = false;
    seekBar.disabled = false;
    expandedSeekBar.disabled = false;
    currentTimeLabel.textContent = "0:00";
    expandedCurrentTimeLabel.textContent = "0:00";
    durationLabel.textContent = "0:00";
    expandedDurationLabel.textContent = "0:00";
    seekBar.value = 0;
    expandedSeekBar.value = 0;
    seekBar.style.setProperty("--progress", "0%");
    expandedSeekBar.style.setProperty("--progress", "0%");
    playerStatus.textContent = `Ready to play ${track.title}.`;
    updatePlayButtons();
  }

  async function playTrack(index = currentTrackIndex) {
    if (index < 0 || index >= tracks.length) return;
    if (currentTrackIndex !== index) loadTrack(index);
    const requestId = ++playbackRequestId;
    try {
      await audio.play();
      if (requestId === playbackRequestId && !audio.paused) {
        playerStatus.textContent = `Playing ${currentTrack.title}.`;
      }
    } catch (error) {
      if (requestId !== playbackRequestId || (error.name === "AbortError" && audio.paused)) return;
      playerStatus.textContent = "Playback could not start. Try selecting the preview again.";
      console.error("Audio playback failed:", error);
    }
    updatePlayButtons();
  }

  function togglePlayback() {
    if (!currentTrack) return;
    if (!audio.paused) {
      playbackRequestId += 1;
      audio.pause();
      return;
    }
    playTrack();
  }

  bindPageCards();
  document.addEventListener("site:pagechange", bindPageCards);
  document.addEventListener("click", (event) => {
    const playButton = event.target.closest(".beat-card .card-play");
    if (!playButton) return;
    const card = playButton.closest(".beat-card");
    const index = tracks.findIndex((track) => track.title === card.dataset.title);
    if (index === currentTrackIndex && !audio.paused) {
      playbackRequestId += 1;
      audio.pause();
    } else {
      playTrack(index);
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    const duration = formatTime(audio.duration);
    durationLabel.textContent = duration;
    expandedDurationLabel.textContent = duration;
    cards.find((card) => card.dataset.title === currentTrack?.title)
      ?.querySelector(".track-length")
      ?.replaceChildren(duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    seekBar.value = progress;
    expandedSeekBar.value = progress;
    seekBar.style.setProperty("--progress", `${progress}%`);
    expandedSeekBar.style.setProperty("--progress", `${progress}%`);
    const currentTime = formatTime(audio.currentTime);
    currentTimeLabel.textContent = currentTime;
    expandedCurrentTimeLabel.textContent = currentTime;
  });

  audio.addEventListener("play", updatePlayButtons);
  audio.addEventListener("pause", () => {
    updatePlayButtons();
    if (currentTrack && !audio.ended) playerStatus.textContent = `Paused ${currentTrack.title}.`;
  });
  audio.addEventListener("ended", () => {
    if (shuffleEnabled && tracks.length > 1) {
      playTrack(getAdjacentTrack(1));
      return;
    }
    if (repeatTrack) {
      playTrack(currentTrackIndex);
      return;
    }
    playerStatus.textContent = `${currentTrack.title} finished.`;
    updatePlayButtons();
  });
  audio.addEventListener("error", () => {
    playerStatus.textContent = "This preview could not be loaded. Please try another beat.";
    console.error("Audio preview failed to load:", audio.currentSrc);
    updatePlayButtons();
  });

  playerPlay.addEventListener("click", togglePlayback);
  expandedPlayerPlay.addEventListener("click", togglePlayback);
  volumeRange.addEventListener("input", () => setVolume(volumeRange.value));
  expandedVolumeRange.addEventListener("input", () => setVolume(expandedVolumeRange.value));
  volumeToggles.forEach((button) => {
    button.addEventListener("click", () => {
      if (audio.muted || audio.volume === 0) {
        audio.muted = false;
        if (audio.volume === 0) audio.volume = lastVolume;
      } else {
        lastVolume = audio.volume;
        audio.muted = true;
      }
      updateVolumeControls();
    });
  });
  audio.addEventListener("volumechange", updateVolumeControls);
  updateVolumeControls();
  repeatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      repeatTrack = !repeatTrack;
      audio.loop = repeatTrack;
      updatePlaybackModes();
    });
  });
  shuffleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      shuffleEnabled = !shuffleEnabled;
      if (shuffleEnabled) makeShuffleOrder();
      updatePlaybackModes();
    });
  });
  updatePlaybackModes();
  openFullPlayer.addEventListener("click", () => {
    if (!fullPlayer.open) fullPlayer.showModal();
  });
  document.querySelector("#close-full-player").addEventListener("click", () => fullPlayer.close());
  document.querySelector("#previous-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack(getAdjacentTrack(-1));
  });
  document.querySelector("#expanded-previous-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack(getAdjacentTrack(-1));
  });
  document.querySelector("#next-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack(getAdjacentTrack(1));
  });
  document.querySelector("#expanded-next-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack(getAdjacentTrack(1));
  });

  function seekTo(input) {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Number(input.value) / 100) * audio.duration;
    seekBar.value = input.value;
    expandedSeekBar.value = input.value;
    seekBar.style.setProperty("--progress", `${input.value}%`);
    expandedSeekBar.style.setProperty("--progress", `${input.value}%`);
  }

  seekBar.addEventListener("input", () => seekTo(seekBar));
  expandedSeekBar.addEventListener("input", () => seekTo(expandedSeekBar));
}
