Problem Statement: AI-Powered Unified Cyber Fraud Analysis & Digital Artifact Correlator 

Context: Law enforcement agencies receive a high volume of financial cyber fraud complaints daily (such as mule account operations, APK-based phishing, call spoofing, and UPI fraud). Investigating officers (IOs) frequently struggle with manual evidence triage across disparate artifacts—including CDRs (Call Detail Records), IPDRs (IP Detail Records), bank transaction logs, mobile chat exports, and APK metadata. There is an urgent need for an automated, lightweight digital forensic pipeline to parse, cross-correlate, and highlight actionable intelligence rapidly during the golden hour of reporting. 

Core Challenge: 

Participants must develop an automated triage and correlation engine that can ingest fragmented investigation artifacts and produce a structured, court-admissible forensic intelligence summary. 

Multi-Source Ingestion & Normalization: Parse raw inputs including telecom records (CSV/Excel), bank/UPI settlement sheets, email headers (.eml), and Android system/app dump logs (.txt/.json). 

Entity Correlation Engine: Automatically identify and link common entities (e.g., shared IMEI/IMSI across different phone numbers, recurring beneficiary UPI handles, common IP subnets, or shared device MAC addresses). 

Mule Account & Network Graph Visualizer: Generate a directional transaction and communication flow graph mapping the chain from victim to intermediary mule nodes and ultimate cash-out points. 

Triage & Risk Scoring: Assign a risk score to identified endpoints based on anomaly patterns (e.g., immediate multi-hop fund routing, high-velocity SIM switching, or spoofed header signatures). 

Investigative Brief Generation: Export a standardized, one-page timeline report (PDF/JSON) summarizing prime suspects, linked phone/account clusters, and immediate seizure recommendations suitable for police field units. 

Deliverables for Screening Round: 

Technical Proposal (2–3 Pages): Architecture diagram, data ingestion pipeline, graph-modeling approach, and handling of evidentiary integrity (hash verification). 

Proof of Concept (PoC) / Code Prototype: A working parser or script demonstrating entity linking on a mock sample dataset of telecom and financial records. 

Demonstration Video (Max 3 Minutes): Walkthrough showing input ingestion, automated entity link detection, and graph generation. 

Evaluation Criteria: 

Technical Feasibility & Scalability (30%): Robust parsing logic, schema flexibility, and processing speed on bulk log data. 

Forensic Accuracy & Integrity (25%): Correct entity resolution, avoidance of false links, and adherence to forensic handling standards (SHA-256 hash preservation). 

Usability for Field Officers (25%): Clarity of the generated network graph, simplicity of the dashboard, and legibility of the final investigative summary. 

Innovation & Practicality (20%): Heuristics used for anomaly detection and practicality within standard police workstation environments (offline capability or low-resource overhead). 