from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'store-assets' / 'screenshot-1.png'
W, H = 1280, 800
im = Image.new('RGB', (W, H), '#eef3f8')
d = ImageDraw.Draw(im)
font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
bold_path = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'

def font(size, bold=False):
    return ImageFont.truetype(bold_path if bold else font_path, size)

def text(x, y, value, size=18, fill='#e9edf5', bold=False):
    d.text((x, y), value, font=font(size, bold), fill=fill)

def rounded(box, fill, radius=14, outline=None, width=1):
    d.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)

# A neutral sample page behind the extension popup.
rounded((52, 58, 1228, 742), '#ffffff', 24, '#dce5ef', 2)
rounded((52, 58, 1228, 118), '#f8fafc', 24)
d.rectangle((52, 91, 1228, 118), fill='#f8fafc')
d.ellipse((77, 80, 90, 93), fill='#ff6b6b')
d.ellipse((100, 80, 113, 93), fill='#f6c453')
d.ellipse((123, 80, 136, 93), fill='#5fcf91')
rounded((194, 73, 847, 103), '#e8eef5', 15)
text(210, 79, 'example.com/audio', 14, '#617386')
text(104, 170, 'Sample audio page', 32, '#1c2f45', True)
text(104, 215, 'Play a track, then open Audio Finder & Recorder.', 18, '#66788e')
rounded((104, 278, 707, 411), '#eef5f7', 18)
d.ellipse((134, 307, 209, 382), fill='#16877b')
d.polygon(((164, 325), (164, 364), (190, 344)), fill='#ffffff')
text(234, 309, 'Sample track', 25, '#1c2f45', True)
text(234, 346, 'Audio playing in this tab', 17, '#63768b')
for i, height in enumerate([20, 36, 51, 27, 65, 45, 25, 58, 35, 18, 32, 49, 26, 42]):
    x = 247 + i * 29
    d.rounded_rectangle((x, 490-height//2, x+13, 490+height//2), 6, fill='#23b7ac')
text(104, 588, 'The extension lists detected audio and can capture the tab.', 18, '#63768b')

# Faithful representation of the extension popup layout and labels.
px, py, pw, ph = 774, 134, 392, 535
rounded((px+8, py+10, px+pw+8, py+ph+10), '#d8e2ee', 18)
rounded((px, py, px+pw, py+ph), '#10151f', 16)
icon = Image.open(ROOT / 'icons' / 'icon-48.png').convert('RGBA')
im.paste(icon, (px+20, py+20), icon)
text(px+76, py+17, 'Audio Finder', 22, '#e9edf5', True)
text(px+76, py+47, 'Find audio playing on this tab', 13, '#9da8b9')
rounded((px+18, py+88, px+pw-18, py+204), '#1b2533', 12, '#34445b', 2)
text(px+32, py+102, 'Capture playing audio', 17, '#e9edf5', True)
text(px+32, py+130, 'Start, replay the song, then stop.', 12, '#9da8b9')
text(px+32, py+167, 'Save as', 12, '#aebbd0')
rounded((px+93, py+156, px+178, py+188), '#273448', 7, '#40536d')
text(px+110, py+163, 'MP3  v', 12)
rounded((px+215, py+151, px+pw-32, py+191), '#16877b', 8)
text(px+233, py+161, 'Start capture', 13, '#ffffff', True)
text(px+20, py+226, 'Detected requests  2', 15, '#e9edf5', True)
text(px+333, py+228, 'Clear', 12, '#aebbd0')
d.line((px+18, py+262, px+pw-18, py+262), fill='#293445', width=2)
text(px+20, py+273, 'sample-track.mp3', 14, '#e9edf5', True)
text(px+20, py+297, 'https://example.com/audio/sample...', 11, '#94a4b8')
text(px+20, py+319, 'AUDIO FILE', 10, '#9dd3c8', True)
rounded((px+278, py+270, px+370, py+300), '#273448', 7)
text(px+294, py+276, 'Download', 11)
rounded((px+278, py+305, px+370, py+335), '#273448', 7)
text(px+301, py+311, 'Capture', 11)
d.line((px+18, py+354, px+pw-18, py+354), fill='#293445', width=2)
text(px+20, py+366, 'live-stream.m3u8', 14, '#e9edf5', True)
text(px+20, py+390, 'https://example.com/audio/live...', 11, '#94a4b8')
text(px+20, py+412, 'STREAM PLAYLIST', 10, '#9dd3c8', True)
rounded((px+278, py+373, px+370, py+405), '#273448', 7)
text(px+301, py+380, 'Capture', 11)
d.line((px+18, py+452, px+pw-18, py+452), fill='#293445', width=2)
text(px+20, py+466, 'Play the song, then refresh this list.', 12, '#9da8b9')
text(px+20, py+487, 'Save only audio you have permission to keep.', 12, '#9da8b9')

im.save(OUT, 'PNG', optimize=True)
print(OUT)
