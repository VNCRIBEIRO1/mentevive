#!/usr/bin/env python3
"""
MenteVive Portal Mockup Video - Complete Automation
Gera vídeo com color grading e audio automático
"""

import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# Config
PROJECT_ROOT = Path(__file__).parent
HTML_FILE = PROJECT_ROOT / "mockup-video.html"
OUTPUT_VIDEO = PROJECT_ROOT / "mockup-raw.mp4"
FINAL_VIDEO = PROJECT_ROOT / "MenteVive-Portal-Mockup-Video-Final.mp4"
AUDIO_FILE = PROJECT_ROOT / "mockup-audio.mp3"
TEMP_DIR = PROJECT_ROOT / ".temp"

# Colors (for console output)
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def log(message, color=RESET):
    """Print colored message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{RESET}")

def check_dependencies():
    """Verify all required tools are installed"""
    log("🔍 Checking dependencies...", BLUE)
    
    deps = {
        'ffmpeg': 'FFmpeg (for video processing)',
        'ffprobe': 'FFprobe (for video analysis)',
    }
    
    missing = []
    for cmd, desc in deps.items():
        result = subprocess.run(['where' if sys.platform == 'win32' else 'which', cmd], 
                              capture_output=True)
        if result.returncode != 0:
            missing.append(f"  ❌ {desc}")
        else:
            log(f"  ✅ {desc}", GREEN)
    
    if missing:
        log("\n❌ Missing dependencies:", RED)
        for m in missing:
            print(m)
        log("\nInstall FFmpeg from: https://ffmpeg.org/download.html", YELLOW)
        return False
    
    log("✅ All dependencies found!\n", GREEN)
    return True

def check_input_video():
    """Check if raw video exists"""
    if not OUTPUT_VIDEO.exists():
        log(f"\n❌ Raw video not found: {OUTPUT_VIDEO}", RED)
        log(f"\n📺 Follow these steps:", BLUE)
        log("1. Open mockup-video.html in your browser (Chrome/Firefox)")
        log("2. The mockup will auto-play")
        log("3. Record with OBS Studio (60fps, 1920x1080):")
        log("   - Download: https://obsproject.com")
        log("   - Scene: Add Display Capture (your monitor)")
        log("   - Settings: Output resolution 1920x1080, FPS 60")
        log("   - Start recording when mockup starts playing")
        log("4. Save as 'mockup-raw.mp4' in this directory")
        log("5. Run this script again")
        return False
    
    log(f"✅ Found raw video: {OUTPUT_VIDEO.name}", GREEN)
    
    # Get video info
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,duration',
        '-of', 'default=noprint_wrappers=1:nokey=1:noescapes=1',
        str(OUTPUT_VIDEO)
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        info = result.stdout.strip().split('\n')
        if len(info) >= 3:
            log(f"   Resolution: {info[0]}x{info[1]}", GREEN)
            log(f"   FPS: {info[2]}", GREEN)
    
    return True

def create_audio_track():
    """Create audio track with silence (user will add music later)"""
    log("\n🎵 Creating audio track...", BLUE)
    
    # Create 180 second silence MP3
    cmd = [
        'ffmpeg', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-t', '180', '-q:a', '9', '-acodec', 'libmp3lame',
        '-y', str(AUDIO_FILE)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        log(f"✅ Audio track created: {AUDIO_FILE.name}", GREEN)
        return True
    else:
        log(f"❌ Failed to create audio: {result.stderr}", RED)
        return False

def apply_color_grading():
    """Apply warm MenteVive color grade"""
    log("\n🎬 Applying color grading (warm palette)...", BLUE)
    
    # FFmpeg filter for warm color grading
    # Increase reds/yellows, slight desaturation, brighten
    filters = (
        "colorbalance=rs=0.2:gs=0.1:bs=-0.1:rm=0.1:gm=0.1:bm=-0.05:rh=0.15:gh=0.1:bh=-0.05,"
        "curves=master='0/0 0.5/0.55 1/1',"
        "hue=s=0.95,"
        "levels=gamma=1.05"
    )
    
    output_colored = PROJECT_ROOT / "mockup-colored.mp4"
    
    cmd = [
        'ffmpeg', '-i', str(OUTPUT_VIDEO),
        '-vf', filters,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-y', str(output_colored)
    ]
    
    log("   Processing (this may take a few minutes)...", YELLOW)
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        log(f"✅ Color grading complete", GREEN)
        return output_colored
    else:
        log(f"❌ Color grading failed: {result.stderr}", RED)
        return None

def create_final_video(colored_video):
    """Merge video with audio and finalize"""
    log("\n🎞️  Creating final video (video + audio mix)...", BLUE)
    
    if not colored_video.exists():
        log(f"❌ Colored video not found: {colored_video}", RED)
        return False
    
    cmd = [
        'ffmpeg',
        '-i', str(colored_video),
        '-i', str(AUDIO_FILE),
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
        '-y', str(FINAL_VIDEO)
    ]
    
    log("   Finalizing (this may take a minute)...", YELLOW)
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        log(f"✅ Final video created: {FINAL_VIDEO.name}", GREEN)
        
        # Get final video info
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of',
            'default=noprint_wrappers=1:nokey=1:noescapes=1',
            str(FINAL_VIDEO)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            duration = float(result.stdout.strip())
            minutes = int(duration // 60)
            seconds = int(duration % 60)
            log(f"   Duration: {minutes}:{seconds:02d}", GREEN)
        
        file_size_mb = FINAL_VIDEO.stat().st_size / (1024 * 1024)
        log(f"   File size: {file_size_mb:.1f} MB", GREEN)
        
        return True
    else:
        log(f"❌ Final video creation failed: {result.stderr}", RED)
        return False

def cleanup():
    """Remove temporary files"""
    files_to_remove = [
        PROJECT_ROOT / "mockup-colored.mp4",
        PROJECT_ROOT / "mockup-audio.mp3",
    ]
    
    for f in files_to_remove:
        if f.exists():
            try:
                f.unlink()
            except:
                pass

def print_summary():
    """Print final summary"""
    log("\n" + "="*60, BOLD)
    log("📹 MOCKUP VIDEO GENERATION COMPLETE!", GREEN + BOLD)
    log("="*60, BOLD)
    
    if FINAL_VIDEO.exists():
        file_size_mb = FINAL_VIDEO.stat().st_size / (1024 * 1024)
        log(f"\n✅ Video saved: {FINAL_VIDEO.name}", GREEN)
        log(f"   Path: {FINAL_VIDEO}", BLUE)
        log(f"   Size: {file_size_mb:.1f} MB", BLUE)
        log(f"   Format: MP4, H.264, 1920x1080, 60fps", BLUE)
        
        log("\n🎵 Audio Status:", YELLOW)
        log("   Current: Silence track (ready for mixing)", YELLOW)
        log("   Next: Add background music in Premiere/DaVinci", YELLOW)
        
        log("\n🚀 Next Steps:", BLUE)
        log("1. Open " + FINAL_VIDEO.name + " in Premiere Pro or DaVinci Resolve", BLUE)
        log("2. Add background music track (royalty-free)", BLUE)
        log("3. Set music volume to 50%, UI sounds 30%, silence 20%", BLUE)
        log("4. Export as MP4 (H.264, 25 Mbps)", BLUE)
        log("\n✨ Your video is ready for final audio mixing!", GREEN)
    else:
        log(f"\n❌ Final video not found!", RED)
        log("   Check the error messages above", RED)

def main():
    """Main workflow"""
    log("="*60, BOLD)
    log("🎬 MenteVive Portal Mockup - Video Generation", BOLD)
    log("="*60, BOLD)
    
    # Check dependencies
    if not check_dependencies():
        return
    
    # Check for raw video
    if not check_input_video():
        return
    
    # Create audio
    if not create_audio_track():
        return
    
    # Apply color grading
    colored_video = apply_color_grading()
    if not colored_video:
        return
    
    # Create final video
    if not create_final_video(colored_video):
        return
    
    # Cleanup
    cleanup()
    
    # Print summary
    print_summary()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log("\n\n⚠️  Process interrupted by user", YELLOW)
        sys.exit(1)
    except Exception as e:
        log(f"\n❌ Unexpected error: {str(e)}", RED)
        sys.exit(1)
