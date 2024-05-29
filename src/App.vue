<script setup>
</script>

<!-- App.vue -->
<template>
  <div id="app">
    <UploadForm />
  </div>
</template>

<script>
import UploadForm from './components/UploadForm.vue';

export default {
  name: 'App',
  components: {
    UploadForm
  }
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 100px;
}

</style>
