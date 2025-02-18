import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
from tabulate import tabulate

# Load environment variables
load_dotenv()

# Get the project root directory (2 levels up from this script)
ROOT_DIR = Path(__file__).parent.parent.parent

def import_excel_to_mongodb(excel_file_name):
    try:
        excel_path = ROOT_DIR / excel_file_name
        
        print(f"\nLooking for Excel file: {excel_path}")
        
        if not excel_path.exists():
            print(f"\nError: File not found at {excel_path}")
            print("\nMake sure your Excel file is in the project root directory")
            return

        print(f"\nReading Excel file: {excel_file_name}")
        df = pd.read_excel(excel_path)
        
        # Display data info
        print("\nDataset Info:")
        print("-------------")
        print(f"Total rows: {len(df)}")
        print(f"Columns found: {', '.join(df.columns)}")
        
        # Preview data in chunks
        rows_per_page = 5
        current_row = 0
        
        while current_row < len(df):
            print(f"\nRows {current_row + 1} to {min(current_row + rows_per_page, len(df))}:")
            print("=" * 50)
            chunk = df.iloc[current_row:current_row + rows_per_page]
            print(tabulate(chunk, headers='keys', tablefmt='simple', showindex=False))
            
            if current_row + rows_per_page < len(df):
                action = input("\nPress Enter to see more rows, 's' for statistics, or 'c' to continue to import: ").lower()
                if action == 'c':
                    break
                elif action == 's':
                    show_statistics(df)
                else:
                    current_row += rows_per_page
            else:
                break

        # Final confirmation before import
        confirm = input(f"\nReady to import {len(df)} products to MongoDB. Continue? (y/n): ")
        if confirm.lower() != 'y':
            print("Import cancelled")
            return

        # Connect to MongoDB
        print("\nConnecting to MongoDB...")
        client = MongoClient(os.getenv('MONGODB_URI'))
        db_name = os.getenv('DB_NAME', 'your_default_db_name')
        if not db_name:
            raise ValueError("DB_NAME not found in environment variables")
            
        db = client[str(db_name)]
        products_collection = db.products

        # Convert DataFrame to list of dictionaries
        print("Processing data...")
        products = []
        for _, row in df.iterrows():
            product = {
                'itemName': str(row['itemName']).strip(),
                'pcode': str(row['pcode']).strip(),
                'price': float(row['price']) if pd.notna(row['price']) else 0,
                'baseUnit': str(row['baseUnit']).strip(),
                'packagingSize': str(row['packagingSize']).strip(),
                'uom': str(row['uom']).strip(),
                'uoms': str(row['uoms']).strip(),
                'category': str(row['category']).strip(),
                'bestseller': False,
                'image': [],
                'date': int(datetime.now().timestamp() * 1000),
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            products.append(product)

        # Bulk insert with progress
        print("\nImporting to MongoDB...")
        result = products_collection.insert_many(products)
        print(f"\nSuccess! Imported {len(result.inserted_ids)} products")
        
        # Show sample of imported data
        print("\nSample of imported data:")
        sample_data = products_collection.find({'_id': {'$in': result.inserted_ids[:5]}})
        print(tabulate([[d['pcode'], d['itemName'], d['price'], d['category']] 
                       for d in sample_data], 
                      headers=['PCode', 'Name', 'Price', 'Category'],
                      tablefmt='simple'))

    except Exception as e:
        print(f"\nError occurred: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

def show_statistics(df):
    print("\nQuick Statistics:")
    print("----------------")
    print(f"Unique categories: {sorted(df['category'].unique())}")
    print(f"Price range: ${df['price'].min():.2f} to ${df['price'].max():.2f}")
    print(f"Average price: ${df['price'].mean():.2f}")
    print("\nCategory Distribution:")
    print(df['category'].value_counts().to_string())
    print("\nSample PCodes:", ', '.join(df['pcode'].head().tolist()))

if __name__ == "__main__":
    print("\nProduct Import Tool")
    print("==================")
    print("\nMake sure your Excel file:")
    print("1. Is in the project root directory")
    print("2. Has these columns: itemName, pcode, price, baseUnit, packagingSize, uom, uoms, category")
    
    excel_file = input("\nEnter Excel file name (e.g., products.xlsx): ")
    import_excel_to_mongodb(excel_file) 