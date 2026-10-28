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

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }

  function bindPageCards() {
    cards = [...document.querySelectorAll(".beat-card")];
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
  openFullPlayer.addEventListener("click", () => {
    if (!fullPlayer.open) fullPlayer.showModal();
  });
  document.querySelector("#close-full-player").addEventListener("click", () => fullPlayer.close());
  document.querySelector("#previous-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack((currentTrackIndex - 1 + tracks.length) % tracks.length);
  });
  document.querySelector("#expanded-previous-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack((currentTrackIndex - 1 + tracks.length) % tracks.length);
  });
  document.querySelector("#next-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack((currentTrackIndex + 1) % tracks.length);
  });
  document.querySelector("#expanded-next-track").addEventListener("click", () => {
    if (currentTrackIndex >= 0) playTrack((currentTrackIndex + 1) % tracks.length);
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
