# iKlinika — User guide (non-technical)

*Simple instructions for clinic staff. Menu names below match what you see on screen (Albanian labels).*

---

## 1. Introduction

### What this system does

**iKlinika** helps your clinic:

- Register and look up **patients**
- Open and track **cases** (one visit or treatment episode per patient)
- Record **nurse measurements** (vitals)
- Let the **doctor** write the medical report and move the case forward
- View **reports**, **payments** (completed visits), **services**, and **lab files** (where your setup includes them)

### Who it is for

| Who | Typical use |
|-----|-------------|
| **Reception / Nurse** | Register patients, enter vitals, send the case to the doctor |
| **Doctor** | Open cases, consult, write diagnosis and therapy, complete the visit |
| **Clinic admin** | Clinic profile, services, staff users (depending on your role) |
| **Super admin** *(if you have this)* | Approving new clinic applications, wide access |

---

## 2. Login & access

### How to log in

1. Open the web address your clinic was given (bookmark it).
2. Enter your **email** and **password**.
3. Click to sign in.

### After login

- Some clinics ask you to choose **Nurse** or **Doctor** when you open the dashboard. Pick the role you are using **right now**.
- If you only ever work as the doctor in a small clinic, you may go straight to the dashboard without that step.

### If the password is wrong

- Check **Caps Lock** and spelling.
- Try typing the password in a blank note first, then copy it carefully if needed.
- If it still fails, ask your **clinic administrator** to reset your account or give you a new password.

### If you are locked out

- Do not keep guessing; contact **support** or your **admin** (see section 7).

---

## 3. Roles overview (what each role usually sees)

Your **sidebar menu** may look different depending on your role. Below is the idea, not every clinic is identical.

### Nurse (or front desk)

- **Pacientët** — register a new patient  
- **Lista e pacientëve** — search existing patients  
- **Rastet** — list of cases; open a case to add vitals and progress the visit  
- **Laboratori** — upload or view lab PDFs for a case *(hidden in some small “solo doctor” setups)*  

### Doctor

- **Rastet** — open the patient’s case  
- **Raportet** — list of finished visits; open case or download PDF where available  
- **Profili i mjekut** — your professional details / signature setup *(if shown)*  
- **Laboratori** — same as above when available  

### Clinic admin / broader access

May also include:

- **Shërbimet** — services and prices  
- **Pagesat** — overview of **completed / closed** cases and amounts  
- **Stafi** — user accounts for the clinic  
- **Profili i klinikës** — clinic name, contact, logo  

### Super admin *(rare)*

- **Aplikimet** — review clinics that applied to join the platform  

---

## 4. Step-by-step tasks (daily workflows)

Think: *What do I click, in what order?*

### A. Register a new patient (nurse / reception)

1. Open **Pacientët** in the sidebar.  
2. Fill in the form (name, date of birth, phone, etc.).  
3. Submit / save.  
4. The system often takes you toward **cases** so you can continue the visit.

### B. Start a case and add nurse vitals

1. Open **Rastet**.  
2. Find the patient’s row and open the case (e.g. **Hap**).  
3. In the case screen, find the **vitals** section (weight, blood pressure, temperature, pulse, etc.).  
4. Enter the values and **save** them.  
5. Use the button that **sends the case to the doctor** (wording may be like “send to consultation” / next step — follow the on-screen button).  
6. The **status** of the case should move forward (for example from *waiting* toward *in consultation*).

### C. Doctor consultation and report

1. Open **Rastet**.  
2. Open the case that is ready for you (status often shows **Në konsultim** / in consultation).  
3. Read patient info and vitals.  
4. Fill in **anamnesis**, **diagnosis**, and **therapy** as your clinic requires.  
5. Save the report.  
6. When the visit is done, use the action that **completes** the case from the doctor’s side (status becomes **Përfunduar** — completed).  
7. The clinic may later **close** the case (**Mbyllur** — finished) for billing / archive; that may be another role or the same doctor, depending on your process.

### D. Attach a service and price (when your clinic uses it)

1. Inside the **case**, find the **service** dropdown (if present).  
2. Choose the service that was performed.  
3. Save. The price usually comes from your **Shërbimet** list.

### E. View reports and download PDF

1. Open **Raportet**.  
2. Use **time** and **search** options if you need to narrow the list.  
3. Open a row to see the case, or use **PDF** where the button appears.

### F. Payments overview (admin / finance)

1. Open **Pagesat**.  
2. Read the short explanation on the page: it lists visits that are **completed** or **closed** (these are treated as billable in the system).  
3. Use filters for **date**, **patient name**, and **service** to match your reports.  
4. Check the **totals** at the top and the **footer** of the table.

### G. Lab results PDF (when Laboratori is available)

1. Open **Laboratori** or the **lab section inside a case** (your screen may use one or both).  
2. Pick the case / upload the PDF as your clinic trained you.  
3. Download when you need a copy.

### H. Manage clinic users (admin)

1. Open **Stafi**.  
2. Add or edit users as your administrator trained you.  
3. Give each person the correct role so they see the right menu.

---

## 5. Common actions

| I want to… | Where to go |
|------------|-------------|
| **Find a patient** | **Lista e pacientëve** — use search if there is a search box |
| **See today’s workload** | **Paneli** (home) for summary numbers; **Rastet** for the live list |
| **Filter cases** | On **Rastet**, use tabs and filters (e.g. today / yesterday, name, date) |
| **Refresh the list** | Use **Rifresko** / refresh on the page if the list looks old |
| **Edit clinic branding** | **Profili i klinikës** (admin) |
| **Change services or prices** | **Shërbimet** (admin) |

*Deleting patients or cases may be restricted or unavailable on purpose — ask your admin.*

---

## 6. Understanding case status (simple words)

You will see words like these on a case:

| On screen (example) | Meaning in plain words |
|---------------------|-------------------------|
| **Në pritje** | Waiting — not started or waiting for nurse step |
| **Në progres** | In progress — nurse / intake work |
| **Në konsultim** | Ready for or during doctor consultation |
| **Përfunduar** | Doctor finished the medical part |
| **Mbyllur** | Case closed on the clinic side (archive / billing) |

The case usually moves **forward** in this order. If a button is missing, your role may not be allowed for that step, or the case is not in the right status yet.

---

## 7. Troubleshooting

| Problem | What to try |
|---------|-------------|
| **I cannot log in** | Check email/password; ask admin to verify the account is active. |
| **I do not see a menu item** | Your **role** may not include it, or you picked **Nurse** / **Doctor** panel wrong at login. Log out and choose again if applicable. |
| **Data does not save** | Wait for the save to finish; check your internet; try **refresh** and open the case again. If a red error appears, screenshot it for support. |
| **Page keeps loading** | Refresh the browser; try another browser; check Wi‑Fi. |
| **I opened the case but I am on the “wrong” view** | Some setups use a **nurse** vs **doctor** view on the same case URL. Use the link from **Rastet** again or the back button and reopen. |
| **PDF does not download** | Try again; check pop-up blocker; ask if your role may view that report. |

---

## 8. Contact / support

Fill in your real contacts here:

- **Clinic IT / admin:** _________________________  
- **Phone:** _________________________  
- **Email:** _________________________  
- **Support hours:** _________________________  

---

## 9. Tips for trainers (optional)

- Add **screenshots** next to each section (snipping tool, arrows, circles on buttons).  
- Record **short videos** (e.g. Loom): “Register patient”, “Nurse vitals”, “Doctor completes case”.  
- Keep this file in **Google Docs** or **Notion** if you want easier sharing; export **PDF** for official handover.

---

*End of guide — iKlinika / clinic operations.*
