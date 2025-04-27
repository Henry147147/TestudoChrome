from typing import List
import json
import inference

inference_client = inference.init_client()

GPA_CALC = {
    "A+":4.0, "A":4.0, "A-":3.7,
    "B+":3.3, "B":3.0, "B-":2.7,
    "C+":2.3, "C":2.0, "C-":1.7,
    "D+":1.3, "D":1.0, "D-":0.7,
    "F":0.0,  "W":0.0
}

def aggregate_grade_data(grade_data):
    histogram = {g: 0 for g in GPA_CALC}
    for entry in grade_data:
        for grade, count in entry.items():
            if grade in GPA_CALC:
                histogram[grade] += int(count)

    total_points = sum(GPA_CALC[g] * c for g, c in histogram.items())
    total_taken  = sum(c for g, c in histogram.items() if g != "W")  # skip W

    gpa = total_points / total_taken if total_taken else 0.0
    return histogram, gpa


async def split_and_summarize_reviews(reviews):
    result = [review["review"] for review in reviews]
    buckets = bucketize(result, 40000)
    return await inference.run_batches(inference_client, buckets)

def process_to_prompt(sentences):
    return sentences

def combine_multiple_summarizations(summarizations):
    return summarizations

def summarize_single(sentences):
    return sentences

def bucketize(words: List[str], max_chars: int) -> List[List[str]]:
    if max_chars <= 0:
        raise ValueError("max_chars must be a positive integer")

    buckets: List[List[str]] = []
    bucket: List[str] = []
    bucket_len = 0

    append_bucket = buckets.append
    append_word   = bucket.append
    len_word      = len

    for w in words:
        w_len = len_word(w)
        
        if bucket and bucket_len + w_len > max_chars:
            append_bucket(bucket)
            bucket      = [w]              
            bucket_len  = w_len
            append_word = bucket.append     
        else:
            append_word(w)
            bucket_len += w_len

        if bucket_len == w_len and w_len > max_chars:
            append_bucket(bucket)
            bucket, bucket_len = [], 0
            append_word = bucket.append

    if bucket:                              
        append_bucket(bucket)

    return buckets
