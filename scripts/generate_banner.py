import math
from PIL import Image, ImageDraw, ImageFont

# Canvas dimensions (2x Retina high resolution)
WIDTH = 2400
HEIGHT = 1260

# Base canvas with deep obsidian background
bg_color = (11, 15, 12)  # #0B0F0C
image = Image.new("RGBA", (WIDTH, HEIGHT), bg_color)

# 1. Radial Ambient Glow in Center
glow_img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_img)
center_x, center_y = WIDTH // 2, HEIGHT // 2
max_radius = 750

for r in range(max_radius, 0, -6):
    alpha = int(32 * (1 - r / max_radius) ** 2)
    # Luma Lime (#DBEF90 -> 219, 239, 144)
    glow_draw.ellipse(
        [center_x - r, center_y - int(r * 0.65), center_x + r, center_y + int(r * 0.65)],
        fill=(219, 239, 144, alpha),
    )

image = Image.alpha_composite(image, glow_img)

# 2. Subtle Grid Lines (Modern tech pattern)
grid_color = (30, 42, 32, 90)
grid_size = 75
grid_img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
grid_draw = ImageDraw.Draw(grid_img)

for x in range(0, WIDTH, grid_size):
    grid_draw.line([(x, 0), (x, HEIGHT)], fill=grid_color, width=1)
for y in range(0, HEIGHT, grid_size):
    grid_draw.line([(0, y), (WIDTH, y)], fill=grid_color, width=1)

image = Image.alpha_composite(image, grid_img)

# Load System Fonts (Segoe UI for crisp modern geometry)
try:
    font_hero = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 112)
    font_h2 = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 40)
    font_h3 = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 24)
    font_body = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 21)
    font_mono_sm = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 20)
    font_mono_xs = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 17)
except Exception:
    font_hero = font_h2 = font_h3 = font_sub = font_body = font_mono_sm = font_mono_xs = ImageFont.load_default()

def draw_card(layer, box, fill, border_color, radius=24, border_width=2):
    layer.rounded_rectangle(box, radius=radius, fill=fill, outline=border_color, width=border_width)

cards_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
draw = ImageDraw.Draw(cards_layer)

# 3. Floating Background Cards (Clean, sleek, uncluttered)

# --- Top Left: Weekly Timetable Card ---
tt_box = [130, 110, 680, 410]
draw_card(draw, tt_box, (16, 22, 17, 180), (40, 56, 42, 140), radius=26, border_width=2)
draw.text((165, 145), "Weekly Timetable", font=font_h3, fill=(240, 245, 240, 220))
draw.text((560, 150), "GMT+7", font=font_mono_xs, fill=(160, 180, 160, 160))

days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
for i, d in enumerate(days):
    draw.text((165 + i * 100, 195), d, font=font_mono_xs, fill=(140, 165, 140, 170))

# Course Slots
draw_card(draw, [165, 235, 385, 365], (36, 49, 0, 210), (219, 239, 144, 200), radius=16, border_width=1)
draw.text((180, 250), "MSIS207", font=font_h3, fill=(219, 239, 144, 255))
draw.text((180, 285), "Database Systems", font=font_body, fill=(225, 235, 225, 210))
draw.text((180, 325), "Room E32", font=font_mono_sm, fill=(180, 205, 180, 180))

draw_card(draw, [405, 235, 645, 365], (22, 30, 24, 180), (48, 66, 50, 140), radius=16, border_width=1)
draw.text((420, 250), "CS5433", font=font_h3, fill=(210, 225, 210, 220))
draw.text((420, 285), "Data Visualization", font=font_body, fill=(210, 220, 210, 190))
draw.text((420, 325), "Room C206", font=font_mono_sm, fill=(160, 185, 160, 160))


# --- Top Right: Deep Focus Pomodoro Timer Card ---
pomo_box = [1720, 110, 2270, 410]
draw_card(draw, pomo_box, (16, 22, 17, 180), (40, 56, 42, 140), radius=26, border_width=2)

ring_c = (1860, 260)
ring_r = 95
draw.ellipse([ring_c[0] - ring_r, ring_c[1] - ring_r, ring_c[0] + ring_r, ring_c[1] + ring_r],
             outline=(32, 44, 34, 210), width=12)
draw.arc([ring_c[0] - ring_r, ring_c[1] - ring_r, ring_c[0] + ring_r, ring_c[1] + ring_r],
         start=-90, end=190, fill=(219, 239, 144, 255), width=12)
draw.text((1805, 235), "25:00", font=font_h2, fill=(255, 255, 255, 255))

draw.text((2010, 210), "Deep Focus Studio", font=font_h3, fill=(240, 245, 240, 220))
draw.text((2010, 250), "Pomodoro Focus Sprint", font=font_body, fill=(160, 185, 160, 180))
draw_card(draw, [2010, 295, 2185, 340], (36, 49, 0, 220), (219, 239, 144, 220), radius=12, border_width=1)
draw.text((2030, 305), "● RUNNING", font=font_mono_sm, fill=(219, 239, 144, 255))


# --- Bottom Left: Course Syllabus & Topic Mastery Card ---
syll_box = [130, 840, 680, 1150]
draw_card(draw, syll_box, (16, 22, 17, 180), (40, 56, 42, 140), radius=26, border_width=2)
draw.text((165, 870), "Curriculum Topics", font=font_h3, fill=(240, 245, 240, 220))
draw_card(draw, [485, 866, 645, 902], (36, 49, 0, 180), (219, 239, 144, 180), radius=10, border_width=1)
draw.text((498, 874), "✨ AI EXTRACTOR", font=font_mono_xs, fill=(219, 239, 144, 255))

topic_items = [
    ("Chapter 1: Relational Architecture", "DONE", (34, 197, 94)),
    ("Chapter 2: Normalization (1NF-3NF)", "DOING", (245, 158, 11)),
    ("Chapter 3: SQL Transactions & ACID", "TODO", (156, 163, 175)),
]
for idx, (title, status, st_col) in enumerate(topic_items):
    ty = 925 + idx * 62
    draw_card(draw, [165, ty, 645, ty + 48], (22, 30, 24, 170), (42, 58, 44, 120), radius=12, border_width=1)
    draw.text((185, ty + 12), title, font=font_body, fill=(225, 235, 225, 220))
    # Status pill
    draw_card(draw, [555, ty + 9, 630, ty + 39], (st_col[0]//4, st_col[1]//4, st_col[2]//4, 210), (*st_col, 200), radius=8, border_width=1)
    draw.text((570, ty + 13), status, font=font_mono_xs, fill=(*st_col, 255))


# --- Bottom Right: Acoustic Soundscape & Language Card ---
sound_box = [1720, 840, 2270, 1150]
draw_card(draw, sound_box, (16, 22, 17, 180), (40, 56, 42, 140), radius=26, border_width=2)
draw.text((1755, 870), "Ambient Soundscape", font=font_h3, fill=(240, 245, 240, 220))
draw_card(draw, [2135, 866, 2235, 902], (22, 30, 24, 200), (55, 75, 58, 160), radius=10, border_width=1)
draw.text((2150, 874), "EN | VI", font=font_mono_xs, fill=(219, 239, 144, 255))

# Waveform visualizer
points = []
for i in range(480):
    wx = 1755 + i
    wy = 985 + math.sin(i * 0.05) * 25 + math.sin(i * 0.02) * 14
    points.append((wx, wy))
draw.line(points, fill=(219, 239, 144, 220), width=3)
draw.text((1755, 1050), "432Hz Binaural Beats · Rain & Cafe Acoustic", font=font_body, fill=(160, 185, 160, 180))

image = Image.alpha_composite(image, cards_layer)

# 4. Centerpiece Showcase Card (Clean, Simple, Minimalist)
center_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
cdraw = ImageDraw.Draw(center_layer)

cw, ch = 980, 580
c_left = (WIDTH - cw) // 2
c_top = (HEIGHT - ch) // 2
c_box = [c_left, c_top, c_left + cw, c_top + ch]

# Multi-layer ambient drop shadow
for off in range(36, 0, -4):
    shadow_box = [c_left - off, c_top - off + 8, c_left + cw + off, c_top + ch + off + 8]
    alpha_shadow = int(18 * (1 - off / 36))
    cdraw.rounded_rectangle(shadow_box, radius=36, fill=(0, 0, 0, alpha_shadow))

# Center Card Body (Glassmorphism with glowing neon border)
draw_card(cdraw, c_box, (13, 19, 14, 245), (219, 239, 144, 255), radius=36, border_width=3)

# Center Icon: Radiant Geometric Diamond Leaf
icon_cx, icon_cy = WIDTH // 2, c_top + 95
cdraw.ellipse([icon_cx - 42, icon_cy - 42, icon_cx + 42, icon_cy + 42], fill=(36, 49, 0, 240), outline=(219, 239, 144, 255), width=2)
diamond_pts = [
    (icon_cx, icon_cy - 26),
    (icon_cx + 24, icon_cy),
    (icon_cx, icon_cy + 26),
    (icon_cx - 24, icon_cy),
]
cdraw.polygon(diamond_pts, fill=(219, 239, 144, 255))
cdraw.line([(icon_cx, icon_cy - 24), (icon_cx, icon_cy + 24)], fill=(13, 19, 14, 255), width=2)

# Title: "Luma" (Massive, Bold, Pure White)
title = "Luma"
t_bbox = font_hero.getbbox(title)
t_w = t_bbox[2] - t_bbox[0]
cdraw.text(((WIDTH - t_w) // 2, c_top + 160), title, font=font_hero, fill=(255, 255, 255, 255))

# Subtitle 1: "STUDENT FOCUS & STUDY HUB" (Neon lime)
sub1 = "STUDENT FOCUS & STUDY HUB"
s1_bbox = font_h2.getbbox(sub1)
s1_w = s1_bbox[2] - s1_bbox[0]
cdraw.text(((WIDTH - s1_w) // 2, c_top + 295), sub1, font=font_h2, fill=(219, 239, 144, 255))

# Subtitle 2: "Academic Productivity & Schedule Engine"
sub2 = "Academic Productivity & Schedule Engine"
s2_bbox = font_sub.getbbox(sub2)
s2_w = s2_bbox[2] - s2_bbox[0]
cdraw.text(((WIDTH - s2_w) // 2, c_top + 360), sub2, font=font_sub, fill=(185, 200, 185, 220))

# Tech Stack Badges at Bottom of Center Card
tech_items = ["React 19", "Vite", "Tailwind CSS", "Node.js", "Express 5", "MySQL 8", "Gemini AI"]
total_w = 0
pill_widths = []
for item in tech_items:
    b = font_mono_sm.getbbox(item)
    w = (b[2] - b[0]) + 30
    pill_widths.append(w)
    total_w += w + 14
total_w -= 14

curr_x = (WIDTH - total_w) // 2
pill_y = c_top + 450
for idx, item in enumerate(tech_items):
    pw = pill_widths[idx]
    draw_card(cdraw, [curr_x, pill_y, curr_x + pw, pill_y + 38], (22, 32, 24, 220), (55, 75, 58, 180), radius=19, border_width=1)
    cdraw.text((curr_x + 15, pill_y + 8), item, font=font_mono_sm, fill=(205, 220, 205, 230))
    curr_x += pw + 14

image = Image.alpha_composite(image, center_layer)

# Save final image
final_img = image.convert("RGB")
out_path = "d:/Study/Web Application Development/SFSH/docs/screenshots/sfsh-banner.jpg"
final_img.save(out_path, quality=96)
print("Updated banner with Luma branding at:", out_path)
