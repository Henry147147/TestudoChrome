current_dir=$(pwd)
echo $current_dir
./llama-server \
 -m "$current_dir/models/llama-3.1-8b-instruct-q4_k_m.gguf" \
--alias qwen-7b-summarizer \
--threads 16 \
--threads-batch 16 \
--host 0.0.0.0 \
--port 8001 \
--parallel 4 \
--ctx-size 12288 \
--batch-size 3062 \
--ubatch-size 512 \
--gpu-layers 35 \
--temp 0.1 \
--top-p 0.9 \
--top-k 40 \
--repeat-penalty 1.2 \
--frequency-penalty 0.2 \
--n-predict 150 \
--keep -1 \
--api-key "llama-api-key-183921" \
-cb