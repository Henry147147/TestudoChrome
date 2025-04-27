current_dir=$(pwd)
echo current_dir
./llama-server \
 -m "$current_dir/models/Qwen2.5-7B-Instruct-IQ4_XS.gguf \
--alias qwen-7b-summarizer \
--threads 16 \
--threads-batch 16 \
--parallel 4 \
--ctx-size 12288 \
--batch-size 2048 \
--ubatch-size 512 \
--gpu-layers 35 \
--cache-type-k q4_0 \
--cache-type-v q4_0 \
--temp 0.1 \
--top-p 0.9 \
--top-k 40 \
--repeat-penalty 1.2 \
--frequency-penalty 0.2 \
--n-predict 150 \
--keep -1 \
