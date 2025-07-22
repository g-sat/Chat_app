#!/usr/bin/env python3
"""
Script to convert the markdown report to PDF format using ReportLab
"""

import markdown
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import os
from datetime import datetime
import re

def create_custom_styles():
    """Create custom paragraph styles for the document"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_CENTER,
        borderWidth=0,
        borderColor=colors.HexColor('#3498db'),
        borderPadding=10,
        borderRadius=5,
        backColor=colors.HexColor('#ecf0f1')
    ))
    
    # Heading styles
    styles.add(ParagraphStyle(
        name='CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        spaceBefore=30,
        textColor=colors.HexColor('#2c3e50'),
        borderWidth=0,
        borderColor=colors.HexColor('#3498db'),
        borderPadding=5,
        borderRadius=3,
        backColor=colors.HexColor('#f8f9fa')
    ))
    
    styles.add(ParagraphStyle(
        name='CustomHeading2',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=15,
        spaceBefore=25,
        textColor=colors.HexColor('#34495e'),
        leftIndent=20,
        borderWidth=0,
        borderColor=colors.HexColor('#3498db'),
        borderPadding=3,
        borderRadius=2,
        backColor=colors.HexColor('#f8f9fa')
    ))
    
    styles.add(ParagraphStyle(
        name='CustomHeading3',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#2c3e50'),
        leftIndent=30
    ))
    
    # Body text style
    styles.add(ParagraphStyle(
        name='CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#333333')
    ))
    
    # Code style
    styles.add(ParagraphStyle(
        name='CustomCode',
        parent=styles['Code'],
        fontSize=10,
        fontName='Courier',
        backColor=colors.HexColor('#f8f9fa'),
        borderWidth=1,
        borderColor=colors.HexColor('#dee2e6'),
        borderPadding=5,
        borderRadius=3
    ))
    
    return styles

def parse_markdown_to_elements(markdown_content, styles):
    """Parse markdown content and convert to ReportLab elements"""
    elements = []
    
    # Split content by sections
    sections = markdown_content.split('\n## ')
    
    for i, section in enumerate(sections):
        if i == 0:  # First section (title)
            lines = section.split('\n')
            title = lines[0].replace('# ', '')
            elements.append(Paragraph(title, styles['CustomTitle']))
            elements.append(Spacer(1, 20))
            
            # Add remaining content from first section
            remaining_content = '\n'.join(lines[1:])
            if remaining_content.strip():
                elements.extend(parse_section_content(remaining_content, styles))
        else:
            # Add section heading
            lines = section.split('\n', 1)
            heading = lines[0]
            content = lines[1] if len(lines) > 1 else ""
            
            elements.append(Paragraph(f"## {heading}", styles['CustomHeading1']))
            elements.append(Spacer(1, 15))
            
            if content.strip():
                elements.extend(parse_section_content(content, styles))
    
    return elements

def parse_section_content(content, styles):
    """Parse section content and convert to ReportLab elements"""
    elements = []
    
    # Split by subsections
    subsections = content.split('\n### ')
    
    for i, subsection in enumerate(subsections):
        if i == 0:  # First subsection
            elements.extend(parse_text_content(subsection, styles))
        else:
            # Add subsection heading
            lines = subsection.split('\n', 1)
            heading = lines[0]
            subcontent = lines[1] if len(lines) > 1 else ""
            
            elements.append(Paragraph(f"### {heading}", styles['CustomHeading2']))
            elements.append(Spacer(1, 10))
            
            if subcontent.strip():
                elements.extend(parse_text_content(subcontent, styles))
    
    return elements

def parse_text_content(content, styles):
    """Parse text content and convert to ReportLab elements"""
    elements = []
    
    lines = content.split('\n')
    current_paragraph = []
    
    for line in lines:
        line = line.strip()
        
        if not line:
            if current_paragraph:
                # End current paragraph
                text = ' '.join(current_paragraph)
                elements.append(Paragraph(text, styles['CustomBody']))
                current_paragraph = []
        elif line.startswith('- '):
            # List item
            if current_paragraph:
                text = ' '.join(current_paragraph)
                elements.append(Paragraph(text, styles['CustomBody']))
                current_paragraph = []
            
            # Add list item with bullet
            list_text = f"• {line[2:]}"
            elements.append(Paragraph(list_text, styles['CustomBody']))
        elif line.startswith('✅ '):
            # Success item
            if current_paragraph:
                text = ' '.join(current_paragraph)
                elements.append(Paragraph(text, styles['CustomBody']))
                current_paragraph = []
            
            # Add success item
            success_text = f"✓ {line[3:]}"
            elements.append(Paragraph(success_text, styles['CustomBody']))
        elif line.startswith('```'):
            # Code block
            if current_paragraph:
                text = ' '.join(current_paragraph)
                elements.append(Paragraph(text, styles['CustomBody']))
                current_paragraph = []
            # Skip code blocks for now (simplified)
        else:
            # Regular text
            current_paragraph.append(line)
    
    # Add remaining paragraph
    if current_paragraph:
        text = ' '.join(current_paragraph)
        elements.append(Paragraph(text, styles['CustomBody']))
    
    return elements

def convert_markdown_to_pdf(markdown_file, pdf_file):
    """Convert markdown file to PDF using ReportLab"""
    
    # Read the markdown file
    with open(markdown_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Create custom styles
    styles = create_custom_styles()
    
    # Parse markdown and create elements
    elements = parse_markdown_to_elements(markdown_content, styles)
    
    # Build PDF
    doc.build(elements)
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
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 