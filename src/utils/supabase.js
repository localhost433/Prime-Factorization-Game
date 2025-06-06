import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    'https://duaphheurwtztixftgmq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1YXBoaGV1cnd0enRpeGZ0Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTMxMDEsImV4cCI6MjA2NDc2OTEwMX0.hMz3q9TvvdO2CxdNm9H1QaCntBG7eGmvUIwSDxiK35g'
);