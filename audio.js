/**
 * PUNI POP! - ASMR Sound Engine
 * Web Audio API を用いた純粋なプロシージャル音響合成エンジン
 * 外部音声ファイルへの依存ゼロ、超低レイテンシ、自由なピッチ変化と癒やしの音響
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.seGain = null;
    this.bgmGain = null;
    
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.seVolume = 0.85;
    this.bgmVolume = 0.35;
    
    this.isBgmActive = true;
    this.bgmNodes = [];
    this.bgmTimer = null;

    // ペンタトニック音階（Cメジャースケール: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6, D6...）
    this.scale = [
      261.63, 293.66, 329.63, 392.00, 440.00, // オクターブ4
      523.25, 587.33, 659.25, 783.99, 880.00, // オクターブ5
      1046.50, 1174.66, 1318.51, 1567.98, 1760.00, // オクターブ6
      2093.00, 2349.32, 2637.02 // オクターブ7
    ];
  }

  // ユーザーの最初の操作でAudioContextを初期化
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // マスターゲイン
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // SEゲイン
    this.seGain = this.ctx.createGain();
    this.seGain.gain.setValueAtTime(this.seVolume, this.ctx.currentTime);
    this.seGain.connect(this.masterGain);

    // BGMゲイン
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    // BGM開始
    if (this.isBgmActive) {
      this.startAmbientBgm();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  setSeVolume(val) {
    this.seVolume = Math.max(0, Math.min(1, val));
    if (this.seGain && this.ctx) {
      this.seGain.gain.setTargetAtTime(this.seVolume, this.ctx.currentTime, 0.05);
    }
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  toggleBgm() {
    this.isBgmActive = !this.isBgmActive;
    if (this.isBgmActive) {
      this.startAmbientBgm();
    } else {
      this.stopAmbientBgm();
    }
    return this.isBgmActive;
  }

  /**
   * ぷにっ音 (Squish)
   * 柔らかく瑞々しいウォータードロップ＋ゼリーの押し込み音
   */
  playSquish(pitchFactor = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    
    // 主オシレータ（まろやかなサイン波）
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // ぷにっと下がるピッチエンベロープ
    const baseFreq = 380 * pitchFactor;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, baseFreq * 0.4), t + 0.12);

    // ローパスフィルターで角を丸め、温かい音に
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.12);

    // アンプエンベロープ
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.seGain);

    osc.start(t);
    osc.stop(t + 0.15);

    // 水滴のようなチャプッというかすかな高域
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq * 2.2, t);
    subOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, t + 0.06);

    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.12, t + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    subOsc.connect(subGain);
    subGain.connect(this.seGain);

    subOsc.start(t);
    subOsc.stop(t + 0.08);
  }

  /**
   * ぽよん音 (Bounce / Release)
   * 指を離したときの弾力あるスプリング音
   */
  playBounce(pitchFactor = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 220 * pitchFactor;
    osc.type = 'sine';

    // ぽよよ〜んと周波数がクイッと上がって落ち着く
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.8, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.4, t + 0.18);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.seGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  /**
   * 引っ張り音 (Stretch)
   * 伸ばしている最中のソフトな音
   */
  playStretch(intensity = 0.5) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const freq = 180 + intensity * 220;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq + 40, t + 0.06);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08 * intensity, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.seGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * 破裂音 (Pop! / Burst)
   * シャンパンの泡が弾けたような、あるいは気泡緩衝材（プチプチ）を潰したような
   * 極めて心地よく爽快なパチッというASMR音
   */
  playPop(pitchFactor = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;

    // 1. ノイズによる破裂アタック（パチッ）
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800 * pitchFactor, t);
    noiseFilter.Q.setValueAtTime(3.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.seGain);

    whiteNoise.start(t);

    // 2. 弾けるトーン（ポコッというレゾナンス）
    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    
    toneOsc.type = 'sine';
    const startFreq = (550 + Math.random() * 100) * pitchFactor;
    toneOsc.frequency.setValueAtTime(startFreq, t);
    toneOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.35, t + 0.08);

    toneGain.gain.setValueAtTime(0.55, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    toneOsc.connect(toneGain);
    toneGain.connect(this.seGain);

    toneOsc.start(t);
    toneOsc.stop(t + 0.1);

    // 3. 微細なキラメキ（高域のピン音）
    const sparkleOsc = this.ctx.createOscillator();
    const sparkleGain = this.ctx.createGain();
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(1400 * pitchFactor, t);
    sparkleOsc.frequency.exponentialRampToValueAtTime(2600 * pitchFactor, t + 0.05);

    sparkleGain.gain.setValueAtTime(0.001, t);
    sparkleGain.gain.linearRampToValueAtTime(0.2, t + 0.01);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(this.seGain);

    sparkleOsc.start(t);
    sparkleOsc.stop(t + 0.09);
  }

  /**
   * 連鎖音 (Chain / Combo)
   * 連鎖するたびに音階が上がり、マリンバ／クリスタルベルのような澄んだ癒やしの音を奏でる
   */
  playChain(comboIndex = 1) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const noteIndex = Math.min(comboIndex - 1, this.scale.length - 1);
    const freq = this.scale[noteIndex % this.scale.length];

    // クリスタルマリンバ風（基本波＋オクターブ上の倍音）
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.756, t); // キラリとしたベル調の非整数倍音

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();

    // エンベロープ
    gain1.gain.setValueAtTime(0.5, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    gain2.gain.setValueAtTime(0.2, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.seGain);
    gain2.connect(this.seGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.46);
    osc2.stop(t + 0.26);

    // 破裂音も同時に重ねて爽快感最大化
    this.playPop(1.0 + (noteIndex * 0.06));
  }

  /**
   * 癒やしのアンビエントBGM (Procedural Ambient Soundscape)
   * 穏やかで透明感のあるシンセパッドとランダムな鈴の音
   */
  startAmbientBgm() {
    if (!this.isBgmActive) return;
    this.stopAmbientBgm();

    if (!this.ctx) return;

    // 定期的にペンタトニックの和音を優しくフェードイン・フェードアウト
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major
      [220.00, 261.63, 329.63, 440.00], // A minor
      [174.61, 261.63, 349.23, 440.00], // F major
      [196.00, 246.94, 293.66, 392.00]  // G major
    ];

    let chordIdx = 0;

    const playChord = () => {
      if (!this.isBgmActive || !this.ctx || this.isMuted) return;

      const chord = chords[chordIdx % chords.length];
      chordIdx++;
      const now = this.ctx.currentTime;
      const duration = 5.5;

      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq * 0.5, now); // 1オクターブ下で落ち着いたパッド

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.045 / chord.length, now + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });

      // たまに星の光のような高いチャイムを鳴らす
      if (Math.random() > 0.4) {
        const chimeFreq = this.scale[Math.floor(Math.random() * 8) + 6];
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(chimeFreq, now + 1.2);

        chimeGain.gain.setValueAtTime(0.001, now + 1.2);
        chimeGain.gain.linearRampToValueAtTime(0.06, now + 1.4);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.bgmGain);

        chimeOsc.start(now + 1.2);
        chimeOsc.stop(now + 3.1);
      }
    };

    playChord();
    this.bgmTimer = setInterval(playChord, 5200);
  }

  stopAmbientBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// グローバルインスタンス
window.soundEngine = new SoundEngine();
