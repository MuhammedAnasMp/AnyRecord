import os
import shutil
import struct
import io
import numpy as np
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRANDING_DIR = os.path.join(BASE_DIR, "branding")
LOGO_DIR = os.path.join(BRANDING_DIR, "logo")
BRANDING_ICONS_DIR = os.path.join(BRANDING_DIR, "icons")
ICONS_PNG_DIR = os.path.join(BASE_DIR, "icons", "icons", "png")
ICONS_MAC_DIR = os.path.join(BASE_DIR, "icons", "icons", "mac")
ICONS_WIN_DIR = os.path.join(BASE_DIR, "icons", "icons", "win")
PUBLIC_APP_ICONS_DIR = os.path.join(BASE_DIR, "public", "app-icons")
DIST_APP_ICONS_DIR = os.path.join(BASE_DIR, "dist", "app-icons")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

source_1024_path = os.path.join(LOGO_DIR, "anyrecord-1024.png")

raw_img = Image.open(source_1024_path).convert("RGBA")
# Crop out extra transparent padding if present so icon fills the canvas
raw_alpha = np.array(raw_img)[:, :, 3]
y_idx, x_idx = np.where(raw_alpha > 0)
if len(y_idx) > 0 and (y_idx.min() > 20 or x_idx.min() > 20):
    content_box = (int(x_idx.min()), int(y_idx.min()), int(x_idx.max() + 1), int(y_idx.max() + 1))
    cropped = raw_img.crop(content_box)
else:
    cropped = raw_img

im1024 = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)

# Apply 4x super-sampled smooth rounded corner mask (~23.5% radius for distinct, smooth rounded edges)
scale = 4
big_size = (1024 * scale, 1024 * scale)
big_radius = int(1024 * 0.235 * scale)
mask_hi = Image.new("L", big_size, 0)
draw = ImageDraw.Draw(mask_hi)
draw.rounded_rectangle([(0, 0), (big_size[0] - 1, big_size[1] - 1)], radius=big_radius, fill=255)
mask = mask_hi.resize((1024, 1024), Image.Resampling.LANCZOS)
im1024.putalpha(mask)
# Update master icon
im1024.save(source_1024_path, "PNG")

def get_image_for_size(size):
    return im1024.resize((size, size), Image.Resampling.LANCZOS)

def build_windows_ico(sizes, output_path):
    """
    Build a standard Windows .ico file with true 32-bit BGRA DIB for <= 128
    and PNG for 256 to ensure Windows User32/GDI titlebar and explorer
    render rounded corners with proper alpha blending on Windows 10/11.
    """
    entries = []
    image_data = []
    offset = 6 + len(sizes) * 16

    for size in sizes:
        img = get_image_for_size(size)
        if size == 256:
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            data = buf.getvalue()
            w_byte = 0
            h_byte = 0
        else:
            w = size
            h = size
            w_byte = w if w < 256 else 0
            h_byte = h if h < 256 else 0

            # BGRA pixel data (bottom-up DIB)
            pixels = []
            for y in range(h - 1, -1, -1):
                for x in range(w):
                    r, g, b, a = img.getpixel((x, y))
                    pixels.append(struct.pack("<BBBB", b, g, r, a))
            xor_data = b"".join(pixels)

            # 1-bit AND mask row-padded to 32 bits
            and_row_bytes = ((w + 31) // 32) * 4
            and_rows = []
            for y in range(h - 1, -1, -1):
                row_byte_list = bytearray(and_row_bytes)
                for x in range(w):
                    _, _, _, a = img.getpixel((x, y))
                    if a < 128:
                        byte_idx = x // 8
                        bit_idx = 7 - (x % 8)
                        row_byte_list[byte_idx] |= (1 << bit_idx)
                and_rows.append(bytes(row_byte_list))
            and_data = b"".join(and_rows)

            header = struct.pack(
                "<IIIHHIIIIII",
                40,       # biSize
                w,        # biWidth
                h * 2,    # biHeight (doubled for icon)
                1,        # biPlanes
                32,       # biBitCount
                0,        # biCompression (BI_RGB)
                len(xor_data) + len(and_data), # biSizeImage
                0, 0, 0, 0 # xpels, ypels, clrused, clrimp
            )
            data = header + xor_data + and_data

        data_size = len(data)
        entry = struct.pack(
            "<BBBBHHII",
            w_byte,
            h_byte,
            0,  # color count
            0,  # reserved
            1,  # planes
            32, # bpp
            data_size,
            offset
        )
        entries.append(entry)
        image_data.append(data)
        offset += data_size

    ico_header = struct.pack("<HHH", 0, 1, len(sizes))
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(ico_header)
        for e in entries:
            f.write(e)
        for d in image_data:
            f.write(d)
    print(f"   Generated Windows ICO ({len(sizes)} sizes) at {output_path}")

print("1. Updating icons/icons/png/...")
os.makedirs(ICONS_PNG_DIR, exist_ok=True)
png_sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
for s in png_sizes:
    target_path = os.path.join(ICONS_PNG_DIR, f"{s}x{s}.png")
    img = get_image_for_size(s)
    img.save(target_path, "PNG")
    print(f"   Generated {target_path} ({s}x{s})")

print("2. Generating icons/icons/win/icon.ico...")
win_ico_path = os.path.join(ICONS_WIN_DIR, "icon.ico")
build_windows_ico([16, 24, 32, 48, 64, 128, 256], win_ico_path)
shutil.copy2(win_ico_path, os.path.join(BRANDING_ICONS_DIR, "icon.ico"))

print("3. Generating icons/icons/mac/icon.icns and build/icon.icns...")
os.makedirs(ICONS_MAC_DIR, exist_ok=True)
mac_icns_path = os.path.join(ICONS_MAC_DIR, "icon.icns")
im1024.save(mac_icns_path, format="ICNS")
shutil.copy2(mac_icns_path, os.path.join(BRANDING_ICONS_DIR, "icon.icns"))
os.makedirs(os.path.join(BASE_DIR, "build"), exist_ok=True)
shutil.copy2(mac_icns_path, os.path.join(BASE_DIR, "build", "icon.icns"))
print(f"   Saved {mac_icns_path}")

print("4. Updating public/app-icons/ and dist/app-icons/...")
os.makedirs(PUBLIC_APP_ICONS_DIR, exist_ok=True)
if os.path.exists(DIST_APP_ICONS_DIR):
    os.makedirs(DIST_APP_ICONS_DIR, exist_ok=True)

app_icon_sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
for s in app_icon_sizes:
    img = get_image_for_size(s)
    for prefix in ["anyrecord-", "anyrecordmac-"]:
        p = os.path.join(PUBLIC_APP_ICONS_DIR, f"{prefix}{s}.png")
        img.save(p, "PNG")
        if os.path.exists(DIST_APP_ICONS_DIR):
            dp = os.path.join(DIST_APP_ICONS_DIR, f"{prefix}{s}.png")
            img.save(dp, "PNG")
    # Also save to unified branding/icons
    bp = os.path.join(BRANDING_ICONS_DIR, f"icon-{s}.png")
    img.save(bp, "PNG")

print("5. Generating public/favicon.ico and docs/favicon.ico...")
public_ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
build_windows_ico([16, 32, 48], public_ico_path)
docs_ico_path = os.path.join(BASE_DIR, "docs", "favicon.ico")
shutil.copy2(public_ico_path, docs_ico_path)

print("6. Updating docs and services icons...")
docs_logo_path = os.path.join(BASE_DIR, "docs", "assets", "logo.png")
os.makedirs(os.path.dirname(docs_logo_path), exist_ok=True)
get_image_for_size(128).save(docs_logo_path, "PNG")
services_dirs = [
    os.path.join(BASE_DIR, "services", "recordly-share", "worker"),
    os.path.join(BASE_DIR, "services", "recordly-share", "worker", "web", "dist"),
    os.path.join(BASE_DIR, "services", "recordly-share", "worker", "web", "public"),
]
img64 = get_image_for_size(64)
for sdir in services_dirs:
    if os.path.exists(sdir):
        target = os.path.join(sdir, "icon-64.png")
        img64.save(target, "PNG")
        print(f"   Saved {target}")

print("All branding assets generated successfully with rounded corners!")
