# 📸 How to Add Your Braiding Service Images

## ✅ What I've Done:

I've added a **beautiful sliding background carousel** to your home page! It will automatically slide through 4 images every 5 seconds.

---

## 📁 Where to Add Your Images:

**Location:** `public/images/`

Add 4 braiding service photos with these exact names:

- `braiding-1.jpg`
- `braiding-2.jpg`
- `braiding-3.jpg`
- `braiding-4.jpg`

---

## 📸 How to Add Images:

### Step 1: Prepare Your Photos

1. Choose 4 beautiful braiding service photos
2. Resize them to **1920 x 1080 pixels** (landscape)
3. Compress them at [tinypng.com](https://tinypng.com) (keeps site fast!)

### Step 2: Rename Your Photos

Rename them EXACTLY as:

- `braiding-1.jpg`
- `braiding-2.jpg`
- `braiding-3.jpg`
- `braiding-4.jpg`

### Step 3: Add to Website

1. Open folder: `C:\Users\hi\Desktop\Mani Beauty\public\images`
2. Copy your 4 renamed photos into this folder
3. Save and refresh your browser!

---

## 🎨 Features Added:

✅ **Auto-Sliding** - Images change every 5 seconds  
✅ **Smooth Transitions** - Beautiful fade effect  
✅ **Navigation Dots** - Click to jump to any image  
✅ **Responsive** - Works on mobile and desktop  
✅ **Professional Overlay** - Text stays readable over images

---

## 🎯 Image Tips:

**Best Photos:**

- High quality (clear, not blurry)
- Good lighting
- Showcase your best braiding work
- Different braiding styles (variety)
- Professional-looking backgrounds

**Avoid:**

- Low resolution/blurry photos
- Dark or poorly lit images
- Photos with too much clutter
- Very large file sizes (compress them!)

---

## 🔄 Change Slide Speed:

Want images to change faster or slower?

**Edit:** `app/page.js` (line ~20)

```javascript
}, 5000) // Change this number (in milliseconds)
```

- 3000 = 3 seconds (faster)
- 5000 = 5 seconds (current)
- 7000 = 7 seconds (slower)

---

## 🎨 Customize Overlay Color:

Want to change the overlay color/transparency?

**Edit:** `app/page.js` (around line 50)

```javascript
background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.85) 0%, rgba(107, 114, 128, 0.75) 50%, rgba(255, 255, 255, 0.85) 100%)',
```

Change the last number in each `rgba()` to adjust transparency:

- `0.85` = 85% opaque (current)
- `0.50` = 50% opaque (lighter overlay)
- `0.95` = 95% opaque (darker overlay)

---

## 🖼️ Don't Have Images Yet?

**Temporary Solution:**
You can use placeholder images for now:

1. Go to [unsplash.com](https://unsplash.com)
2. Search "hair braiding" or "braiding hairstyles"
3. Download 4 free images
4. Follow the steps above

Or keep the current gradient background until you have your own photos!

---

## 📱 Test Your Images:

After adding images:

1. Refresh browser (Ctrl + Shift + R)
2. Watch the slideshow
3. Click the dots to switch manually
4. Check on mobile phone too!

---

## ⚠️ Troubleshooting:

**Images not showing?**

- Check file names are EXACTLY: `braiding-1.jpg` (not `Braiding-1.JPG`)
- Make sure they're in `public/images/` folder
- File format must be `.jpg`, `.jpeg`, or `.png`
- Refresh browser with Ctrl + Shift + R

**Slideshow not working?**

- Check browser console (F12) for errors
- Make sure server is running (`npm run dev`)

---

## 🎉 What You Got:

Your home page now has:

- ✅ Professional sliding background
- ✅ Your existing text content (unchanged)
- ✅ Navigation dots
- ✅ Auto-play slideshow
- ✅ Mobile responsive
- ✅ Smooth animations

---

**Next Step:** Add your 4 braiding service photos to the `public/images` folder and watch your site come alive! 🌟
