# Classify UI uploads files; the Classify Service extracts text

The Classify UI is an end-user surface for KOBY document classification. An end user drops a Document; the UI sends the intact file to the Classify Service (multipart upload) and displays the Classification response as raw JSON. We deliberately do **not** extract text in the browser: the service README already names document extraction as a service responsibility, and the file stays intact end-to-end so the service can extract (and later persist, re-run, or version the extraction) as it sees fit. Client-side extraction (pdf.js, mammoth) was considered and rejected because it would duplicate a service-owned concern inside the UI and fragment where KOBY's Document knowledge lives.

## Consequences

- The UI presumes a multipart classify endpoint exists today ("assume it works so far"); until the service actually implements it, requests will fail and the UI should surface that honestly rather than paper over it.
- The service gains a file-receiving endpoint whose contract the UI depends on; any change to URL or field name breaks the UI deliberately (contract-on-file).
