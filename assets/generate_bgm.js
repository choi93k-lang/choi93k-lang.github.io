const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;

const NOTE_FREQS = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'REST': 0.0
};

function generateSquareSamples(frequency, duration, volume = 0.2) {
    const numSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float32Array(numSamples);

    if (frequency <= 0) return samples;

    const period = SAMPLE_RATE / frequency;
    for (let i = 0; i < numSamples; i++) {
        let envelope = 1.0;
        if (i < 80) envelope = i / 80;
        else if (i > numSamples - 80) envelope = (numSamples - i) / 80;

        const phase = (i % period) / period;
        samples[i] = (phase < 0.5 ? 1.0 : -1.0) * volume * envelope;
    }
    return samples;
}

function saveWav(filename, samples) {
    const numSamples = samples.length;
    const byteRate = SAMPLE_RATE * 2; // 16-bit mono
    const blockAlign = 2;
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // subchunk size
    buffer.writeUInt16LE(1, 20);  // PCM format
    buffer.writeUInt16LE(1, 22);  // mono
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34); // 16 bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        const intVal = Math.round(s * 32767);
        buffer.writeInt16LE(intVal, offset);
        offset += 2;
    }

    fs.writeFileSync(filename, buffer);
    console.log(`[생성 성공] ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

function buildMelody(melodyList, repeats = 2) {
    let totalSamples = [];
    for (let r = 0; r < repeats; r++) {
        for (const [note, dur, vol] of melodyList) {
            const freq = NOTE_FREQS[note] || 0;
            const samples = generateSquareSamples(freq, dur, vol || 0.18);
            for (let i = 0; i < samples.length; i++) {
                totalSamples.push(samples[i]);
            }
        }
    }
    return new Float32Array(totalSamples);
}

const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

// 1. 아케이드 러시 (스피드 연타, 두더지 잡기: 빠른 140BPM)
const arcadeMelody = [
    ['C4', 0.14], ['E4', 0.14], ['G4', 0.14], ['C5', 0.14],
    ['G4', 0.14], ['E4', 0.14], ['A4', 0.28],
    ['F4', 0.14], ['A4', 0.14], ['C5', 0.14], ['F5', 0.14],
    ['E5', 0.28], ['D5', 0.28],
    ['G4', 0.14], ['B4', 0.14], ['D5', 0.14], ['G5', 0.14],
    ['F5', 0.14], ['D5', 0.14], ['C5', 0.28],
    ['E5', 0.14], ['D5', 0.14], ['C5', 0.14], ['B4', 0.14],
    ['C5', 0.42], ['REST', 0.14]
];
saveWav(path.join(audioDir, 'bgm_arcade_rush.wav'), buildMelody(arcadeMelody, 3));

// 2. 텐션 루프 (반응 속도 측정: 째깍 긴장감 120BPM)
const tensionMelody = [
    ['E3', 0.18], ['REST', 0.18], ['E3', 0.18], ['G3', 0.18],
    ['B3', 0.18], ['REST', 0.18], ['A3', 0.18], ['REST', 0.18],
    ['E3', 0.18], ['REST', 0.18], ['D3', 0.18], ['E3', 0.18],
    ['G3', 0.36], ['E3', 0.36]
];
saveWav(path.join(audioDir, 'bgm_tension_loop.wav'), buildMelody(tensionMelody, 4));

// 3. 퍼즐 코지 (카드 맞추기, 틱택토, 업다운: 포근한 105BPM)
const puzzleMelody = [
    ['C4', 0.3], ['E4', 0.3], ['G4', 0.3], ['B4', 0.3],
    ['A4', 0.6], ['F4', 0.6],
    ['D4', 0.3], ['F4', 0.3], ['A4', 0.3], ['C5', 0.3],
    ['B4', 0.6], ['G4', 0.6],
    ['E4', 0.3], ['G4', 0.3], ['C5', 0.6],
    ['D5', 0.3], ['B4', 0.3], ['C5', 0.6]
];
saveWav(path.join(audioDir, 'bgm_puzzle_cozy.wav'), buildMelody(puzzleMelody, 2));

// 4. 레트로 게임 (주사위 대결, 가위바위보: 통통 튀는 128BPM)
const retroMelody = [
    ['G4', 0.18], ['G4', 0.18], ['E4', 0.18], ['C4', 0.18],
    ['D4', 0.36], ['G4', 0.36],
    ['A4', 0.18], ['B4', 0.18], ['C5', 0.36],
    ['E5', 0.18], ['D5', 0.18], ['C5', 0.36],
    ['F4', 0.18], ['A4', 0.18], ['D5', 0.36],
    ['G4', 0.18], ['B4', 0.18], ['C5', 0.54]
];
saveWav(path.join(audioDir, 'bgm_retro_game.wav'), buildMelody(retroMelody, 3));
