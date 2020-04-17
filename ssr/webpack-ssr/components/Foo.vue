<template>
  <div>
		<h1>{{ msg }}</h1>
		<router-link to="/home">home</router-link>
	</div>
</template>

<script>
export default {
  name: 'Foo',
  data() {
    return {
      msg: 'Foo',
    };
  },
};
</script>
