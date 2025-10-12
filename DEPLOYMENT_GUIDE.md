# 🚀 Deployment Guide - Yetifoam Calculator V2.0

## Overview
This guide provides step-by-step instructions to deploy the Yetifoam Calculator to production using Vercel.

**Status:** ✅ Ready for Deployment
**Version:** 2.0 (26 AI Topics)
**Build:** Successful (676KB bundle, 210KB gzipped)
**Git:** Pushed to GitHub with tag `v2.0-26-topics`

---

## ✅ Pre-Deployment Checklist (COMPLETED)

- [x] Production build successful
- [x] TypeScript compilation clean (no errors)
- [x] All changes committed to git
- [x] Version tagged as `v2.0-26-topics`
- [x] Pushed to GitHub: `https://github.com/RyanRDW/Yetifoam-CAL.git`
- [x] Vercel configuration file updated (`vercel.json`)
- [x] Build artifacts verified (`dist/` folder)

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended) - Automatic Deployment

**Why Vercel:**
- Automatic deployments on git push
- Free for hobby/personal projects
- Built-in SSL certificates
- Global CDN
- Environment variable management
- Zero-downtime deployments

#### Step 1: Connect GitHub Repository to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select **"RyanRDW/Yetifoam-CAL"** from GitHub
5. Click **"Import"**

#### Step 2: Configure Project Settings

**Framework Preset:** Vite
**Root Directory:** `./`
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

#### Step 3: Add Environment Variables

In Vercel project settings, add:

| Name | Value | Required |
|------|-------|----------|
| `VITE_OPENAI_API_KEY` | `sk-svcacct-61Z1KrWzUHQK8EqL7Ep...` | ✅ Required |
| `OPENAI_API_KEY` | `sk-svcacct-61Z1KrWzUHQK8EqL7Ep...` | ⚠️ Optional (for server features) |
| `GROK_API_KEY` | (if using Grok) | ❌ Optional |

**Important:** The `VITE_OPENAI_API_KEY` is required for the AI Sales Assistant to work.

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Vercel will provide a production URL: `https://yetifoam-cal-xxxxxxx.vercel.app`

#### Step 5: Verify Deployment

1. Open the production URL
2. Test calculator functionality:
   - Enter dimensions (e.g., 12m × 8m × 3m)
   - Select pitch (15°)
   - Select cladding (Corrugated)
   - Click Calculate
   - ✅ Verify results display correctly

3. Test AI Sales Assistant:
   - Scroll to AI Panel
   - Select "Dust Degradation" + "Thermal Bridging"
   - Click "Generate Sales Points"
   - ✅ Verify response contains 6-10 statements addressing both topics

#### Step 6: Set Up Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request

✅ **Automatic deployment is now active!**

---

### Option 2: Manual Deployment via Vercel CLI

If you prefer command-line deployment:

#### Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Link Project (First Time Only)

```bash
cd /Users/ryanimac/Desktop/V2\ CAL
vercel link
```

Answer the prompts:
- **Set up and deploy?** Yes
- **Scope:** Your Vercel account
- **Link to existing project?** No (first time) or Yes (if project exists)
- **Project name:** yetifoam-cal
- **Directory:** `./`

#### Step 4: Deploy to Production

```bash
vercel --prod
```

This will:
1. Build the project
2. Upload to Vercel
3. Deploy to production
4. Return deployment URL

#### Step 5: Verify Environment Variables

```bash
vercel env ls
```

If `VITE_OPENAI_API_KEY` is missing:

```bash
vercel env add VITE_OPENAI_API_KEY production
```

Paste your OpenAI API key when prompted.

---

### Option 3: Netlify

#### Step 1: Connect to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub**
4. Choose **"RyanRDW/Yetifoam-CAL"**

#### Step 2: Configure Build Settings

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Branch to deploy:** `main`

#### Step 3: Add Environment Variables

In Netlify site settings → Environment variables:

- `VITE_OPENAI_API_KEY` = `sk-svcacct-61Z1KrWzUHQK8EqL7Ep...`

#### Step 4: Deploy

Click **"Deploy site"** and wait for build to complete.

---

### Option 4: GitHub Pages (Static Hosting)

#### Step 1: Install gh-pages

```bash
npm install --save-dev gh-pages
```

#### Step 2: Add Deploy Script to package.json

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### Step 3: Deploy

```bash
npm run deploy
```

This will:
1. Build the project
2. Create a `gh-pages` branch
3. Push `dist/` folder to GitHub Pages

#### Step 4: Configure GitHub Pages

1. Go to GitHub repository settings
2. Navigate to **Pages**
3. Set source to `gh-pages` branch
4. Site will be live at: `https://ryanrdw.github.io/Yetifoam-CAL/`

**⚠️ Note:** GitHub Pages exposes environment variables in the bundle, so the API key will be visible. Only use for internal tools.

---

## 📊 Post-Deployment Verification

### Critical Tests After Deployment

1. **Calculator Test**
   - Enter: 12m × 8m × 3m, 15° pitch, Corrugated
   - Expected: Total spray area ~110-130 m²
   - ✅ Pass if calculation displays

2. **AI Single Topic Test**
   - Select: "Anti-con"
   - Expected: 3-5 statements about Anti-con
   - ✅ Pass if response appears in 1-3 seconds

3. **AI Multi-Topic Test (New Topics)**
   - Select: "Dust Degradation" + "Thermal Bridging"
   - Expected: 6-10 statements with specific data (40-70%, 1,250x, etc.)
   - ✅ Pass if both topics addressed separately

4. **All 26 Preset Buttons**
   - Verify all chips visible and clickable
   - Original 17: Condensation, Rust, Roof Only, Reflective Foil, Foil Board, Summer Heat, Winter Cold, Anti-con, Too Expensive, Can DIY, Fire, Air-Cell, Batt Walls, Vapour Barrier, Air Barrier, Leaking, Noisy
   - New 9: Dust Degradation, Structural Benefits, Air Sealing / Air Leakage, Thermal Bridging, Total Cost of Ownership, Space Loss, Manufacturer Fraud / Deception, Victoria Climate Specific, Environmental Impact
   - ✅ Pass if all 26 buttons render correctly

5. **Custom Topic Creation**
   - Click "Add Topic"
   - Type "Warranty" and add
   - Select and generate
   - ✅ Pass if AI responds to custom topic

6. **Mobile Responsiveness**
   - Resize browser to mobile width
   - Expected: Layout adapts (desktop-first, min 1280px)
   - ✅ Pass if no horizontal scroll on desktop

7. **Console Errors**
   - Open browser DevTools → Console
   - Expected: No red errors
   - ✅ Pass if console is clean

### Performance Metrics

Monitor these after deployment:

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Page Load Time** | < 2s | Chrome DevTools → Network |
| **AI Response Time** | 1-3s | Time between click and response |
| **Bundle Size** | < 700KB | Vercel dashboard or Network tab |
| **Lighthouse Score** | > 90 | Chrome DevTools → Lighthouse |

---

## 🔍 Monitoring & Maintenance

### API Usage Monitoring

1. **OpenAI Dashboard**
   - URL: [https://platform.openai.com/usage](https://platform.openai.com/usage)
   - Check daily/weekly usage
   - Expected: ~$0.40/month for 1000 requests
   - Set up billing alerts at $5/month

2. **Vercel Analytics**
   - View in Vercel dashboard
   - Monitor: Page views, unique visitors, response times
   - Set up alerts for downtime

### Cost Estimates

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel Hosting** | $0/month | Free for hobby projects |
| **OpenAI API (GPT-4o-mini)** | ~$0.40/month | Based on 1000 requests (~$0.0004/request) |
| **Total** | **~$0.40/month** | Very affordable for internal tool |

### Recommended Monitoring

1. **Set OpenAI Budget Alert**
   - Go to OpenAI dashboard → Settings → Billing
   - Set hard limit: $10/month (25x expected usage)
   - Set soft limit: $2/month (5x expected usage)

2. **Weekly Usage Review**
   - Check OpenAI usage every Monday
   - Review top topics requested
   - Monitor for API errors or rate limits

3. **Monthly Performance Review**
   - Lighthouse audit
   - User feedback from sales team
   - Response quality assessment

---

## 🛠️ Troubleshooting

### Issue: Build Fails on Vercel

**Symptoms:**
- Vercel shows "Build Failed" error
- Error mentions missing dependencies

**Solution:**
```bash
# Locally verify build works
npm run build

# If successful, commit and push
git add .
git commit -m "Fix build configuration"
git push origin main
```

### Issue: AI Doesn't Respond in Production

**Symptoms:**
- Calculator works, but AI shows error or "No API key configured"

**Solution:**
1. Go to Vercel → Project Settings → Environment Variables
2. Verify `VITE_OPENAI_API_KEY` exists
3. If missing, add it with value: `sk-svcacct-61Z1KrWzUHQK8EqL7Ep...`
4. Redeploy: Settings → Deployments → latest deployment → "Redeploy"

### Issue: Topics Not Addressed Comprehensively

**Symptoms:**
- AI responds but only addresses first topic
- Response too short

**Solution:**
- Already fixed in this version (topics formatted as bullet points)
- Verify production build is latest (check for v2.0-26-topics tag)

### Issue: API Rate Limit Exceeded

**Symptoms:**
- Error: "Rate limit exceeded"

**Solution:**
1. Check OpenAI dashboard for usage spikes
2. Increase rate limits on OpenAI dashboard (if needed)
3. Consider implementing response caching (future enhancement)

---

## 🎯 Next Steps After Deployment

### Immediate (First Day)

1. ✅ Deploy to production (follow Option 1 above)
2. ✅ Run all 7 critical tests
3. ✅ Share production URL with sales team
4. ✅ Verify API costs are tracking as expected

### Short-Term (First Week)

1. ⏳ Collect feedback from sales team on AI responses
2. ⏳ Monitor OpenAI usage daily
3. ⏳ Track which topics are used most frequently
4. ⏳ Identify any bugs or issues

### Long-Term (First Month)

1. ⏳ Review response quality with sales team
2. ⏳ Consider adding more preset topics based on usage
3. ⏳ Optimize system prompt based on feedback
4. ⏳ Evaluate cost vs. value

---

## 📞 Support & Documentation

### If Something Goes Wrong

1. **Check Build Logs**
   - Vercel: Deployments → Click deployment → View logs
   - Look for red error messages

2. **Check Browser Console**
   - F12 → Console tab
   - Look for JavaScript errors

3. **Verify Environment Variables**
   - Vercel: Settings → Environment Variables
   - Ensure `VITE_OPENAI_API_KEY` is set

4. **Consult Documentation**
   - [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md)
   - [AI_SYSTEM_GUIDE.md](AI_SYSTEM_GUIDE.md)
   - [AI_TECHNICAL_DOCUMENTATION.md](AI_TECHNICAL_DOCUMENTATION.md)

### Quick Rollback

If deployment has critical issues:

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Vercel will automatically deploy the reverted version
```

Or in Vercel dashboard:
- Deployments → Find last working deployment → "Promote to Production"

---

## ✅ Deployment Completion Checklist

Use this checklist to confirm successful deployment:

- [ ] Production URL is live
- [ ] Calculator generates accurate results
- [ ] AI responds to single topics
- [ ] AI responds to multiple topics (both old and new)
- [ ] All 26 preset buttons visible
- [ ] Custom topics work
- [ ] No console errors
- [ ] Page loads in < 2 seconds
- [ ] AI responds in 1-3 seconds
- [ ] OpenAI usage tracking enabled
- [ ] Sales team has access to URL
- [ ] Bookmark/favorite the production URL

---

## 🎉 Launch Summary

**Production Build:**
- Bundle: 676.33 KB (210.93 KB gzipped)
- Build time: ~3-4 seconds
- No errors or warnings (except chunk size advisory)

**Git Status:**
- Latest commit: `28aa422 - Add comprehensive pre-launch checklist`
- Tag: `v2.0-26-topics`
- Pushed to: `https://github.com/RyanRDW/Yetifoam-CAL.git`

**Features:**
- ✅ 26 AI preset topics (9 new)
- ✅ 50+ new sales talking points
- ✅ Multi-topic selection
- ✅ Custom topic creation
- ✅ Accurate spray area calculations
- ✅ Complete documentation

**Ready for Production:** ✅ YES

---

**Created:** 2025-10-12
**Version:** 2.0
**Status:** 🚀 Ready to Deploy

---

## 🎯 Deploy Now (Quick Start)

**Fastest Deployment (5 minutes):**

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select `RyanRDW/Yetifoam-CAL`
4. Add environment variable: `VITE_OPENAI_API_KEY`
5. Click "Deploy"
6. ✅ Done! Your site is live.

**🎉 You're ready to launch!**
