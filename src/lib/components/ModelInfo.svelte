<script>
    export let modelinfo, infoText;
</script>

<style>
    .card {
        background-color: #f5f5f5;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
</style>

<div class="card">
    <h2>{modelinfo}</h2>
    <p>{@html infoText}</p>
</div>
