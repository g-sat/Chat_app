#!/usr/bin/env python3
"""
Script to convert the markdown report to PDF format
"""

import markdown
from weasyprint import HTML, CSS
import os
from datetime import datetime

def convert_markdown_to_pdf(markdown_file, pdf_file):
    """Convert markdown file to PDF with custom styling"""
    
    # Read the markdown file
    with open(markdown_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(markdown_content, extensions=['tables', 'fenced_code'])
    
    # Create HTML document with custom CSS styling
    html_document = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Chat Application Project Report</title>
        <style>
            @page {{
                size: A4;
                margin: 2cm;
                @top-center {{
                    content: "Chat Application Project Report";
                    font-size: 10pt;
                    color: #666;
                }}
                @bottom-center {{
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 10pt;
                    color: #666;
                }}
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            
            h1 {{
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
                page-break-after: avoid;
            }}
            
            h2 {{
                color: #34495e;
                border-left: 4px solid #3498db;
                padding-left: 15px;
                margin-top: 30px;
                page-break-after: avoid;
            }}
            
            h3 {{
                color: #2c3e50;
                margin-top: 25px;
                page-break-after: avoid;
            }}
            
            h4 {{
                color: #34495e;
                margin-top: 20px;
                page-break-after: avoid;
            }}
            
            p {{
                margin-bottom: 15px;
                text-align: justify;
            }}
            
            ul, ol {{
                margin-bottom: 15px;
                padding-left: 30px;
            }}
            
            li {{
                margin-bottom: 8px;
            }}
            
            code {{
                background-color: #f8f9fa;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }}
            
            pre {{
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #3498db;
                overflow-x: auto;
                page-break-inside: avoid;
            }}
            
            pre code {{
                background-color: transparent;
                padding: 0;
            }}
            
            blockquote {{
                border-left: 4px solid #3498db;
                padding-left: 20px;
                margin: 20px 0;
                font-style: italic;
                color: #555;
            }}
            
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
                page-break-inside: avoid;
            }}
            
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            
            th {{
                background-color: #3498db;
                color: white;
                font-weight: bold;
            }}
            
            tr:nth-child(even) {{
                background-color: #f2f2f2;
            }}
            
            .page-break {{
                page-break-before: always;
            }}
            
            .section {{
                margin-bottom: 30px;
            }}
            
            .highlight {{
                background-color: #fff3cd;
                padding: 10px;
                border-radius: 5px;
                border-left: 4px solid #ffc107;
                margin: 15px 0;
            }}
            
            .success {{
                background-color: #d4edda;
                padding: 10px;
                border-radius: 5px;
                border-left: 4px solid #28a745;
                margin: 15px 0;
            }}
            
            .info {{
                background-color: #d1ecf1;
                padding: 10px;
                border-radius: 5px;
                border-left: 4px solid #17a2b8;
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Generate PDF
    HTML(string=html_document).write_pdf(pdf_file)
    print(f"PDF generated successfully: {pdf_file}")

def main():
    """Main function to generate the PDF report"""
    
    # File paths
    markdown_file = "Chat_Application_Project_Report.md"
    pdf_file = "Chat_Application_Project_Report.pdf"
    
    # Check if markdown file exists
    if not os.path.exists(markdown_file):
        print(f"Error: {markdown_file} not found!")
        return
    
    try:
        # Convert markdown to PDF
        convert_markdown_to_pdf(markdown_file, pdf_file)
        
        # Get file size
        file_size = os.path.getsize(pdf_file)
        print(f"PDF file size: {file_size / 1024:.2f} KB")
        
        # Get current timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"Generated on: {timestamp}")
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        print("Make sure you have weasyprint installed: pip install weasyprint")

if __name__ == "__main__":
    main() 