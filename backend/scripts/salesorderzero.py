#database specific
import pandas as pd
import pyodbc
import warnings
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

warnings.filterwarnings("ignore")

load_dotenv()  # Load environment variables from .env file

# Get credentials from environment variables
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_SERVER = os.getenv('DB_SERVER')
DB_NAME = os.getenv('DB_NAME')

connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={DB_SERVER};DATABASE={DB_NAME};UID={DB_USER};PWD={DB_PASSWORD};TrustServerCertificate=yes'
conn = pyodbc.connect(connection_string)

##################################################################getting item codes##################################################################

query = """
SELECT * FROM (
SELECT sih.[Shipment Date], sih.[No_], sih.[Created By User], sih.[Sell-to Customer Name], sil.Amount FROM dbo.[LIVE EASTERN HARVEST$Sales Invoice Header] sih
INNER JOIN (
SELECT [Document No_], SUM(Amount) AS Amount FROM dbo.[LIVE EASTERN HARVEST$Sales Invoice Line] sil GROUP BY [Document No_]
) sil ON sih.[No_] = sil.[Document No_]
WHERE sil.Amount = 0 AND sih.[Shipment Date] > DATEADD(DAY, -7, CAST(GETDATE() AS DATE)) AND (sih.[Sell-to Customer Name] <> 'For Customer Sample' OR sih.[Created By User] NOT IN ('ZEN', 'JIAWEI'))
) posted_invoices UNION SELECT * FROM 
(
SELECT sh.[Shipment Date], sh.[Posting No_], sh.[Created By User], sh.[Sell-to Customer Name], sl.Amount FROM dbo.[LIVE EASTERN HARVEST$Sales Header] sh
INNER JOIN (
SELECT [Document No_], SUM(Amount) AS Amount FROM dbo.[LIVE EASTERN HARVEST$Sales Line] sil GROUP BY [Document No_]
) sl ON sh.[No_] = sl.[Document No_]
WHERE sl.Amount = 0 AND sh.[Posting No_] <> '' and (sh.[Sell-to Customer Name] <> 'For Customer Sample' OR sh.[Created By User] NOT IN ('ZEN', 'JIAWEI'))
) unposted_invoices
UNION
SELECT * FROM (
SELECT sih.[Shipment Date], sih.[No_], sih.[Created By User], sih.[Sell-to Customer Name], sil.Amount FROM dbo.[LIVE DK FOOD$Sales Invoice Header] sih
INNER JOIN (
SELECT [Document No_], SUM(Amount) AS Amount FROM dbo.[LIVE DK FOOD$Sales Invoice Line] sil GROUP BY [Document No_]
) sil ON sih.[No_] = sil.[Document No_]
WHERE sil.Amount = 0 AND sih.[Shipment Date] > DATEADD(DAY, -7, CAST(GETDATE() AS DATE)) AND (sih.[Sell-to Customer Name] <> 'For Customer Sample' OR sih.[Created By User] NOT IN ('ZEN', 'JIAWEI'))
) posted_invoices UNION SELECT * FROM 
(
SELECT sh.[Shipment Date], sh.[Posting No_], sh.[Created By User], sh.[Sell-to Customer Name], sl.Amount FROM dbo.[LIVE DK FOOD$Sales Header] sh
INNER JOIN (
SELECT [Document No_], SUM(Amount) AS Amount FROM dbo.[LIVE DK FOOD$Sales Line] sil GROUP BY [Document No_]
) sl ON sh.[No_] = sl.[Document No_]
WHERE sl.Amount = 0 AND sh.[Posting No_] <> '' and (sh.[Sell-to Customer Name] <> 'For Customer Sample' OR sh.[Created By User] NOT IN ('ZEN', 'JIAWEI'))
) unposted_invoices
UNION
SELECT * FROM (
SELECT sih.[Shipment Date], sih.[No_], sih.[Created By User], sih.[Sell-to Customer Name], sil.Amount FROM dbo.[LIVE ORIENTAL$Sales Invoice Header] sih
INNER JOIN (
SELECT [Document No_], SUM(Amount) AS Amount FROM dbo.[LIVE ORIENTAL$Sales Invoice Line] sil GROUP BY [Document No_]
) sil ON sih.[No_] = sil.[Document No_]
WHERE sil.Amount = 0 AND sih.[Shipment Date] > DATEADD(DAY, -7, CAST(GETDATE() AS DATE)) AND (sih.[Sell-to Customer Name] <> 'For Customer Sample')
) posted_invoices UNION SELECT * FROM 
(
SELECT sh.[Shipment Date], sh.[Posting No_], sh.[Created By User], sh.[Sell-to Customer Name], sl.Amount FROM dbo.[LIVE ORIENTAL$Sales Header] sh
INNER JOIN (
SELECT [Document No_], SUM(Amount) AS Amount FROM dbo.[LIVE ORIENTAL$Sales Line] sil GROUP BY [Document No_]
) sl ON sh.[No_] = sl.[Document No_]
WHERE sl.Amount = 0 AND sh.[Posting No_] <> '' and (sh.[Sell-to Customer Name] <> 'For Customer Sample')
) unposted_invoices
"""

itemCodeQuery = """
SELECT i.No_, i.Description, i.[Base Unit of Measure],iuom.[Code], iuom.[Qty_ per Unit of Measure]  FROM dbo.[LIVE EASTERN HARVEST$Item] i

INNER JOIN dbo.[LIVE EASTERN HARVEST$Item Unit of Measure] iuom ON  iuom.[Item No_] = i.No_

WHERE i.Blocked = 0
"""

customerPriceListQuery = """
SELECT 
    a.[Sales Code] AS customerId, 
    a.[Item No_] AS pcode, 
    a.[Unit Price] AS unitPrice, 
    a.[Unit of Measure Code] AS uom, 
    c.Name AS customerName, 
    i.Description AS productName 
FROM (
    SELECT 
        sp.[Sales Code], 
        sp.[Item No_], 
        sp.[Unit Price], 
        sp.[Unit of Measure Code] 
    FROM dbo.[LIVE EASTERN HARVEST$Sales Price] sp
    WHERE sp.[Sales Type] = 0
) a 
INNER JOIN dbo.[LIVE EASTERN HARVEST$Customer] c ON c.No_ = a.[Sales Code]
INNER JOIN dbo.[LIVE EASTERN HARVEST$Item] i ON i.No_ = a.[Item No_]
"""

# New query to get all customer IDs
allCustomersQuery = """
SELECT No_ AS customerId, Name AS customerName 
FROM dbo.[LIVE EASTERN HARVEST$Customer]
WHERE Blocked = 0
"""

itemListQuery = """
SELECT i.No_, i.Description FROM dbo.[LIVE EASTERN HARVEST$Item] i

WHERE i.Blocked = 0
"""

# Create output directory
output_dir = "nav_data_exports"
os.makedirs(output_dir, exist_ok=True)

# Generate timestamp for filenames
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Function to execute query and save to Excel
def execute_and_save(query, filename, description, format="excel"):
    try:
        print(f"\nExecuting {description} query...")
        df = pd.read_sql(query, conn)
        print(f"Query returned {len(df)} rows")
        
        if not df.empty:
            # Create full path with timestamp
            if format == "excel":
                output_file = f"{output_dir}/{filename}_{timestamp}.xlsx"
                # Save to Excel
                df.to_excel(output_file, index=False)
            elif format == "json":
                output_file = f"{output_dir}/{filename}_{timestamp}.json"
                # Save to JSON
                df.to_json(output_file, orient="records")
            
            print(f"Data saved to {output_file}")
            
            # Print sample data
            print(f"\nSample {description} (first 5 rows):")
            print("=" * 80)
            print(df.head(5).to_string(index=False))
            print("=" * 80)
            
            return df
        else:
            print(f"No {description} data found.")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error executing {description} query: {str(e)}")
        return pd.DataFrame()

# Function to get customer price list for all customers
def get_all_customer_price_lists(conn):
    try:
        # Get all customers
        print("\nRetrieving all customers...")
        customers_df = pd.read_sql(allCustomersQuery, conn)
        print(f"Found {len(customers_df)} customers")
        
        if customers_df.empty:
            print("No customers found.")
            return pd.DataFrame()
        
        # Initialize an empty dataframe to store all price lists
        all_price_lists = pd.DataFrame()
        
        # For each customer, get their price list
        for index, customer in customers_df.iterrows():
            customer_id = customer['customerId']
            customer_name = customer['customerName']
            
            print(f"\nRetrieving price list for customer: {customer_name} (ID: {customer_id})")
            
            # Modify the query to filter by customer ID
            customer_price_query = f"""
            SELECT 
                a.[Sales Code] AS customerId, 
                a.[Item No_] AS pcode, 
                a.[Unit Price] AS unitPrice, 
                a.[Unit of Measure Code] AS uom, 
                c.Name AS customerName, 
                i.Description AS productName 
            FROM (
                SELECT 
                    sp.[Sales Code], 
                    sp.[Item No_], 
                    sp.[Unit Price], 
                    sp.[Unit of Measure Code] 
                FROM dbo.[LIVE EASTERN HARVEST$Sales Price] sp
                WHERE sp.[Sales Type] = 0 AND sp.[Sales Code] = '{customer_id}'
            ) a 
            INNER JOIN dbo.[LIVE EASTERN HARVEST$Customer] c ON c.No_ = a.[Sales Code]
            INNER JOIN dbo.[LIVE EASTERN HARVEST$Item] i ON i.No_ = a.[Item No_]
            """
            
            customer_prices = pd.read_sql(customer_price_query, conn)
            
            if not customer_prices.empty:
                print(f"Found {len(customer_prices)} price entries for {customer_name}")
                # Append to the main dataframe
                all_price_lists = pd.concat([all_price_lists, customer_prices])
            else:
                print(f"No price list found for {customer_name}")
        
        return all_price_lists
    
    except Exception as e:
        print(f"Error retrieving customer price lists: {str(e)}")
        return pd.DataFrame()

try:
    # Option 1: Execute the original query to get all price lists at once
    price_list_df = execute_and_save(customerPriceListQuery, "customer_price_list", "Customer Price List", format="json")
    
    # Option 2: Get price lists for each customer individually
    # price_list_df = get_all_customer_price_lists(conn)
    # if not price_list_df.empty:
    #     output_file = f"{output_dir}/all_customer_price_lists_{timestamp}.json"
    #     price_list_df.to_json(output_file, orient="records")
    #     print(f"All customer price lists saved to {output_file}")
    
except Exception as e:
    print(f"Error in main execution: {str(e)}")
finally:
    conn.close()
    print("\nDatabase connection closed.")


# try:
#     df = pd.read_sql(query, conn)
#     print(f"Query returned {len(df)} rows")
    
#     # Print the dataframe if not empty
#     if not df.empty:
#         print("\nSales orders with $0 amount in the past 7 days (excluding customer samples):")
#         print("=" * 80)
#         print(df.to_string(index=False))
#         print("=" * 80)
#     else:
#         print("No matching records found.")
# except Exception as e:
#     print(f"Error executing query: {str(e)}")
# finally:
#     conn.close()



