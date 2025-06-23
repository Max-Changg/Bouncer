import re
import pandas as pd

# 1. Extract Zelle Payments from BofA Texts
with open("zelle_sms.txt", "r") as file:
    lines = file.readlines()

pattern = re.compile(r"BofA: (.*?) sent you \$([0-9]+\.\d{2})(?: for.*)?", re.IGNORECASE)

zelle_data = []
for line in lines:
    line = line.strip()
    match = pattern.search(line)
    if match:
        name = match.group(1).strip().lower().replace('\s+', ' ')
        amount = float(match.group(2))
        zelle_data.append({'Name': name, 'Amount': amount})

zelle_df = pd.DataFrame(zelle_data)

# 2. Load all tier sheets from Excel form
all_sheets = pd.read_excel('Seoul Drift Party Responses.xlsx', sheet_name=None)

tier_price = {
    'Tier 1': 5,
    'Tier 2': 7,
    'Tier 3': 10,
    'Tier 4': 15
}

PAYMENT_COL_PREFIX = "You are purchasing ONE ˗ˏˋTier"
form_data = []

for sheet_name, sheet_df in all_sheets.items():
    sheet_df['Tier'] = sheet_name
    method_col = next((col for col in sheet_df.columns if col.startswith(PAYMENT_COL_PREFIX)), None)
    if not method_col:
        raise ValueError(f"❌ Could not find payment column in sheet '{sheet_name}'")
    sheet_df = sheet_df.rename(columns={method_col: 'Raw Payment Method'})
    form_data.append(sheet_df)

form = pd.concat(form_data, ignore_index=True)

form['Name'] = form['Full name (First + Last as shown on ID)']\
    .fillna('').astype(str).str.lower().str.strip().str.replace('\s+', ' ', regex=True)

form['Expected Amount'] = form['Tier'].map(tier_price)

form['Raw Payment Method'] = form['Raw Payment Method'].fillna('').astype(str).str.lower()
form['Payment Method'] = form['Raw Payment Method'].apply(
    lambda text: 'zelle' if 'zelle' in text and 'venmo' not in text else
                 'venmo' if 'venmo' in text else
                 'unknown'
)

# 3. Load Venmo Transactions
venmo = pd.read_csv('VenmoStatement_May_2025.csv', skiprows=2)
venmo['From'] = venmo['From'].fillna('').astype(str).str.lower().str.strip().str.replace('\s+', ' ', regex=True)
venmo['Amount (total)'] = pd.to_numeric(
    venmo['Amount (total)'].astype(str).str.replace('[^\d\.\-]', '', regex=True),
    errors='coerce'
)

# 4. Verifying
venmo_results = []
zelle_results = []

for _, row in form.iterrows():
    name = row['Name']
    email = row.get('Email Address', '')
    method = row['Payment Method']
    expected_amount = row['Expected Amount']

    if method == 'venmo':
        transactions = venmo[venmo['From'] == name]
        if not transactions.empty:
            match = transactions[transactions['Amount (total)'].round(2) == expected_amount]
            if not match.empty:
                venmo_results.append({
                    'Name': name.title(),
                    'Email': email,
                    'Tier': row['Tier'],
                    'Expected Amount': expected_amount,
                    'Status': '✅ Paid',
                    'Received Amount': expected_amount,
                    'Notes': ''
                })
            else:
                received_amt = transactions['Amount (total)'].iloc[0]
                venmo_results.append({
                    'Name': name.title(),
                    'Email': email,
                    'Tier': row['Tier'],
                    'Expected Amount': expected_amount,
                    'Status': '❌ Not Paid',
                    'Received Amount': received_amt,
                    'Difference': round(expected_amount - received_amt, 2),
                    'Notes': 'Incorrect Amount'
                })
        else:
            venmo_results.append({
                'Name': name.title(),
                'Email': email,
                'Tier': row['Tier'],
                'Expected Amount': expected_amount,
                'Status': '❌ Not Paid',
                'Received Amount': '',
                'Difference': '',
                'Notes': 'No Payment Found'
            })

    elif method == 'zelle':
        transactions = zelle_df[zelle_df['Name'] == name]
        if not transactions.empty:
            match = transactions[transactions['Amount'].round(2) == expected_amount]
            if not match.empty:
                zelle_results.append({
                    'Name': name.title(),
                    'Email': email,
                    'Tier': row['Tier'],
                    'Expected Amount': expected_amount,
                    'Status': '✅ Paid',
                    'Received Amount': expected_amount,
                    'Notes': ''
                })
            else:
                received_amt = transactions['Amount'].iloc[0]
                zelle_results.append({
                    'Name': name.title(),
                    'Email': email,
                    'Tier': row['Tier'],
                    'Expected Amount': expected_amount,
                    'Status': '❌ Not Paid',
                    'Received Amount': received_amt,
                    'Difference': round(expected_amount - received_amt, 2),
                    'Notes': 'Incorrect Amount'
                })
        else:
            zelle_results.append({
                'Name': name.title(),
                'Email': email,
                'Tier': row['Tier'],
                'Expected Amount': expected_amount,
                'Status': '❌ Not Paid',
                'Received Amount': '',
                'Difference': '',
                'Notes': 'No Payment Found'
            })

# Saving
pd.DataFrame(venmo_results).to_excel("venmo_verification.xlsx", index=False)
pd.DataFrame(zelle_results).to_excel("zelle_verification.xlsx", index=False)

print("✅ Done!")
print("Created venmo_verification.xlsx")
print("Created zelle_verification.xlsx")
