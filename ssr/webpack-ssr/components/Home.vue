<template>
  <div>
    <h1>{{ msg }}</h1>
    <router-link to="/foo">foo</router-link>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      msg: 'Home',
    };
  },
};
</script>
