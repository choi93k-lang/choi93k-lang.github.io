"""
8비트 레트로 아케이드 게임 BGM 생성 스크립트
외부 라이브러리 설치 없이 파이썬 표준 라이브러리(wave, math, struct)만 사용하여 깨끗한 레트로 사운드를 생성합니다.
"""

import math
import struct
import wave

SAMPLE_RATE = 22050  # 레트로 오디오 샘플 레이트 (22.05kHz)

# 음계별 주파수 (Hz)
NOTE_FREQS = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'REST': 0.0
}

def generate_square_wave(frequency, duration_seconds, volume=0.25):
    """지정된 주파수의 8비트 사각파(Square wave) 신호를 생성합니다."""
    num_samples = int(SAMPLE_RATE * duration_seconds)
    samples = []
    
    if frequency <= 0:
        return [0.0] * num_samples

    period = SAMPLE_RATE / frequency
    for i in range(num_samples):
        # 부드러운 시작/끝 감쇠 (클릭 노이즈 방지)
        envelope = 1.0
        if i < 100:
            envelope = i / 100
        elif i > num_samples - 100:
            envelope = (num_samples - i) / 100

        phase = (i % period) / period
        val = (1.0 if phase < 0.5 else -1.0) * volume * envelope
        samples.append(val)
        
    return samples

def save_wav_file(filename, samples):
    """합성된 오디오 샘플들을 16비트 모노 WAV 파일로 저장합니다."""
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)       # 모노
        wav_file.setsampwidth(2)       # 16비트 (2바이트)
        wav_file.setframerate(SAMPLE_RATE)
        
        packed_data = bytearray()
        for s in samples:
            # -1.0 ~ 1.0 범위 제한 후 16비트 정수 변환
            clamped = max(-1.0, min(1.0, s))
            int_val = int(clamped * 32767)
            packed_data.extend(struct.pack('<h', int_val))
            
        wav_file.writeframes(packed_data)
    print(f"생성 완료: {filename}")

# ===================================================
# 1. 아케이드 러시 (스피드 연타, 두더지 잡기: 빠르고 쾌활한 140BPM)
# ===================================================
def create_arcade_rush_bgm():
    melody = [
        ('C4', 0.14), ('E4', 0.14), ('G4', 0.14), ('C5', 0.14),
        ('G4', 0.14), ('E4', 0.14), ('A4', 0.28),
        ('F4', 0.14), ('A4', 0.14), ('C5', 0.14), ('F5', 0.14),
        ('E5', 0.28), ('D5', 0.28),
        ('G4', 0.14), ('B4', 0.14), ('D5', 0.14), ('G5', 0.14),
        ('F5', 0.14), ('D5', 0.14), ('C5', 0.28),
        ('E5', 0.14), ('D5', 0.14), ('C5', 0.14), ('B4', 0.14),
        ('C5', 0.42), ('REST', 0.14)
    ] * 2  # 2회 반복 루프
    
    samples = []
    for note, dur in melody:
        samples.extend(generate_square_wave(NOTE_FREQS[note], dur, volume=0.18))
    
    save_wav_file("c:/Projects/choi93k-lang.github.io/assets/audio/bgm_arcade_rush.wav", samples)

# ===================================================
# 2. 텐션 루프 (반응 속도 측정: 긴장감 있는 째깍 비트)
# ===================================================
def create_tension_loop_bgm():
    pattern = [
        ('E3', 0.18), ('REST', 0.18), ('E3', 0.18), ('G3', 0.18),
        ('B3', 0.18), ('REST', 0.18), ('A3', 0.18), ('REST', 0.18),
        ('E3', 0.18), ('REST', 0.18), ('D3', 0.18), ('E3', 0.18),
        ('G3', 0.36), ('E3', 0.36)
    ] * 4
    
    samples = []
    for note, dur in pattern:
        samples.extend(generate_square_wave(NOTE_FREQS[note], dur, volume=0.15))
        
    save_wav_file("c:/Projects/choi93k-lang.github.io/assets/audio/bgm_tension_loop.wav", samples)

# ===================================================
# 3. 퍼즐 코지 (카드 맞추기, 틱택토, 업다운: 귀엽고 차분한 멜로디)
# ===================================================
def create_puzzle_cozy_bgm():
    melody = [
        ('C4', 0.3), ('E4', 0.3), ('G4', 0.3), ('B4', 0.3),
        ('A4', 0.6), ('F4', 0.6),
        ('D4', 0.3), ('F4', 0.3), ('A4', 0.3), ('C5', 0.3),
        ('B4', 0.6), ('G4', 0.6),
        ('E4', 0.3), ('G4', 0.3), ('C5', 0.6),
        ('D5', 0.3), ('B4', 0.3), ('C5', 0.6)
    ] * 2
    
    samples = []
    for note, dur in melody:
        samples.extend(generate_square_wave(NOTE_FREQS[note], dur, volume=0.16))
        
    save_wav_file("c:/Projects/choi93k-lang.github.io/assets/audio/bgm_puzzle_cozy.wav", samples)

# ===================================================
# 4. 레트로 게임 (주사위 대결, 가위바위보: 통통 튀는 클래식 오락실)
# ===================================================
def create_retro_game_bgm():
    melody = [
        ('G4', 0.18), ('G4', 0.18), ('E4', 0.18), ('C4', 0.18),
        ('D4', 0.36), ('G4', 0.36),
        ('A4', 0.18), ('B4', 0.18), ('C5', 0.36),
        ('E5', 0.18), ('D5', 0.18), ('C5', 0.36),
        ('F4', 0.18), ('A4', 0.18), ('D5', 0.36),
        ('G4', 0.18), ('B4', 0.18), ('C5', 0.54)
    ] * 2
    
    samples = []
    for note, dur in melody:
        samples.extend(generate_square_wave(NOTE_FREQS[note], dur, volume=0.17))
        
    save_wav_file("c:/Projects/choi93k-lang.github.io/assets/audio/bgm_retro_game.wav", samples)

if __name__ == "__main__":
    create_arcade_rush_bgm()
    create_tension_loop_bgm()
    create_puzzle_cozy_bgm()
    create_retro_game_bgm()
    print("4종 레트로 게임 BGM 생성 완료!")
