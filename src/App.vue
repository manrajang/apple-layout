<template>
  <AppleLayout :scene-list="sceneList" @scrollRatio="test">
    <template #default>
      <section class="section-container" id="scroll-section-0">
        <canvas class="sticky-canvas" id="video-canvas-0" width="1920" height="1080"></canvas>
        <div class="sticky-element message" id="message-a">
          <p>1. Lorem ipsum dolor sit amet consectetur<br />adipisicing elit. Vero, nesciunt!</p>
        </div>
        <div class="sticky-element message" id="message-b">
          <p>2. Lorem ipsum dolor sit amet<br />consectetur adipisicing elit. Vero, nesciunt!</p>
        </div>
        <div class="sticky-element message" id="message-c">
          <p>3. Lorem ipsum dolor sit amet consectetur adipisicing<br />elit. Vero, nesciunt!</p>
        </div>
        <div class="sticky-element message" id="message-d">
          <p>4. Lorem ipsum dolor sit<br />amet consectetur adipisicing elit. Vero, nesciunt!</p>
        </div>
      </section>
      <section class="section-container" id="scroll-section-1">
        <p class="description">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Minima esse iste temporibus reiciendis, praesentium
          vitae perspiciatis sit aliquid cupiditate eligendi sequi cumque ipsum delectus totam sapiente eius aperiam
          nostrum perferendis, ex iure quia rerum! Voluptas a saepe voluptatibus ipsum. Commodi ullam cupiditate
          sapiente beatae repellat magni perspiciatis a iusto porro harum ratione eum, magnam voluptatibus repellendus,
          assumenda facilis nisi necessitatibus expedita voluptas cumque. Dolores aut quaerat quas a nobis dignissimos,
          hic culpa laboriosam voluptatibus voluptates tempora at accusantium corrupti facere! Omnis cum dolor libero
          dolorum fugiat inventore recusandae sapiente voluptas vero harum dignissimos, quasi eaque itaque veniam, ullam
          minus dolores sit temporibus tempora! Commodi vel neque assumenda sint, suscipit eos debitis esse facilis ex
          culpa? Rem, repudiandae vitae officia repellat nesciunt inventore magni soluta officiis laudantium velit
          doloribus voluptas itaque reiciendis optio eaque aperiam dignissimos amet animi nostrum mollitia eos quod
          repellendus. Ut, possimus nihil at dignissimos autem tempora, vel quam labore inventore veniam sint corporis
          expedita. Ullam expedita quas dolor cupiditate quae necessitatibus aspernatur quidem sunt obcaecati distinctio
          id nostrum veniam maxime aliquam totam, consequuntur sequi soluta tenetur fugiat illo eius aperiam dolorem
          atque qui. Corrupti rem consectetur eos enim incidunt dolore nostrum minus suscipit animi natus voluptatem,
          non ullam error saepe, optio, alias blanditiis. A deleniti atque provident. Ab quibusdam fugiat nam sunt
          minima quasi reiciendis veritatis, doloribus, quaerat quia, repellat ea est commodi magni eum in
          necessitatibus placeat voluptates et consequuntur velit harum. Voluptatem sapiente magnam iusto repellat, in
          reiciendis, ad praesentium iure sit quae, neque veniam mollitia aliquam at odit nisi maiores vitae obcaecati
          non? Aut iusto nihil vitae exercitationem distinctio sapiente ipsa enim suscipit asperiores, dolorem provident
          natus saepe reiciendis commodi odit quaerat, dignissimos unde. Qui maiores dolor soluta quaerat repellat quo
          quibusdam voluptatem commodi facilis deleniti iure blanditiis tempora nostrum quod eligendi provident beatae
          veniam, itaque aliquid nesciunt dicta hic vero nobis animi! Vero ea, veritatis quae sapiente aliquam animi,
          distinctio ipsum, repellat deserunt totam nemo tempora nam minima officiis blanditiis quisquam quaerat quod
          quia mollitia natus maxime! Eveniet, corporis. Minima earum repellendus nemo delectus placeat distinctio,
          quasi quisquam fuga, voluptate vitae molestias. Expedita, sint id. Officia molestiae, accusantium adipisci
          similique laborum ex? Inventore minima nam dignissimos eos. Praesentium quis quod perferendis corporis porro,
          nihil possimus laborum excepturi saepe iste accusantium commodi quos cum ipsum sunt facere incidunt eaque
          beatae fugiat ad est adipisci, tenetur eius rem! Est eos hic dolores voluptate, iste corrupti.
        </p>
      </section>
      <section class="section-container" id="scroll-section-2">
        <canvas class="sticky-canvas" id="video-canvas-1" width="1920" height="1080"></canvas>
        <div class="sticky-element message" id="section-title">
          <p>Lorem ipsum dolor sit amet.</p>
        </div>
        <div class="sticky-element second-message a" id="section-message-a">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Illum quod quidem explicabo provident eligendi
            recusandae totam repudiandae atque. Dignissimos, aspernatur.
          </p>
          <div class="pin" id="section-message-c"></div>
        </div>
        <div class="sticky-element second-message b" id="section-message-b">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laudantium aperiam architecto nihil corrupti, eius
            accusantium?
          </p>
          <div class="pin" id="section-message-d"></div>
        </div>
      </section>
      <section class="section-container" id="scroll-section-3">
        <p class="description">Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, totam!</p>
        <div>
          <canvas class="blend-canvas blend-style" width="1920" height="1080" id="blend-canvas"></canvas>
        </div>
        <p class="description">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eveniet at fuga quae perspiciatis veniam impedit et,
          ratione est optio porro. Incidunt aperiam nemo voluptas odit quisquam harum in mollitia. Incidunt minima iusto
          in corporis, dolores velit. Autem, sit dolorum inventore a rerum distinctio vero illo magni possimus
          temporibus dolores neque adipisci, repudiandae repellat. Ducimus accusamus similique quas earum laborum. Autem
          tempora repellendus asperiores illum ex! Velit ea corporis odit? Ea, incidunt delectus. Sapiente rerum neque
          error deleniti quis, et, quibusdam, est autem voluptate rem voluptas. Ratione soluta similique harum nihil
          vel. Quas inventore perferendis iusto explicabo animi eos ratione obcaecati.
        </p>
      </section>
      <section>
        <div style="height: 1024px">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore eaque non adipisci, id obcaecati quo. Delectus
          aut dolore nisi adipisci iusto, blanditiis, saepe corrupti enim voluptates ad asperiores accusamus aperiam?
        </div>
      </section>
    </template>
  </AppleLayout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Scene, BlendAnimation } from '@/types/layoutType';
import AppleLayout from '@/layouts/AppleLayout.vue';

export default Vue.extend({
  name: 'App',
  components: {
    AppleLayout,
  },
  data(): { sceneList: Scene[] } {
    return {
      sceneList: [
        {
          type: 'sticky',
          selector: '#scroll-section-0',
          heightMultiple: 5,
          animationList: [
            {
              selector: '#video-canvas-0',
              videoImage: { from: 0, to: 299, start: 0, end: 1, imageHeight: 1080, imagePathList: [] },
              opacity: { out: { from: 1, to: 0, start: 0.7, end: 0.8 } },
            },
            {
              selector: '#message-a',
              opacity: {
                in: { from: 0, to: 1, start: 0.1, end: 0.15 },
                out: { from: 1, to: 0, start: 0.2, end: 0.25 },
              },
              translateY: {
                in: { from: 20, to: 0, start: 0.1, end: 0.15 },
                out: { from: 0, to: -20, start: 0.2, end: 0.25 },
              },
            },
            {
              selector: '#message-b',
              opacity: {
                in: { from: 0, to: 1, start: 0.3, end: 0.35 },
                out: { from: 1, to: 0, start: 0.4, end: 0.45 },
              },
              translateY: {
                in: { from: 20, to: 0, start: 0.3, end: 0.35 },
                out: { from: 0, to: -20, start: 0.4, end: 0.45 },
              },
            },
            {
              selector: '#message-c',
              opacity: {
                in: { from: 0, to: 1, start: 0.45, end: 0.5 },
                out: { from: 1, to: 0, start: 0.55, end: 0.6 },
              },
              translateY: {
                in: { from: 20, to: 0, start: 0.45, end: 0.5 },
                out: { from: 0, to: -20, start: 0.55, end: 0.6 },
              },
            },
            {
              selector: '#message-d',
              opacity: {
                in: { from: 0, to: 1, start: 0.6, end: 0.65 },
                out: { from: 1, to: 0, start: 0.7, end: 0.75 },
              },
              translateY: {
                in: { from: 20, to: 0, start: 0.6, end: 0.65 },
                out: { from: 0, to: -20, start: 0.7, end: 0.75 },
              },
            },
          ],
        },
        { type: 'normal', selector: '#scroll-section-1', heightMultiple: 1 },
        {
          type: 'sticky',
          selector: '#scroll-section-2',
          heightMultiple: 5,
          animationList: [
            {
              selector: '#video-canvas-1',
              videoImage: { from: 0, to: 388, start: 0, end: 0.8, imageHeight: 1080, imagePathList: [] },
              opacity: {
                in: { from: 0, to: 1, start: 0, end: 0.1 },
                out: { from: 1, to: 0, start: 0.7, end: 0.8 },
              },
            },
            {
              selector: '#section-title',
              opacity: {
                in: { from: 0, to: 1, start: 0.2, end: 0.25 },
                out: { from: 1, to: 0, start: 0.3, end: 0.35 },
              },
              translateY: {
                in: { from: 20, to: 0, start: 0.2, end: 0.25 },
                out: { from: 0, to: -20, start: 0.3, end: 0.35 },
              },
            },
            {
              selector: '#section-message-a',
              opacity: {
                in: { from: 0, to: 1, start: 0.35, end: 0.45 },
                out: { from: 1, to: 0, start: 0.6, end: 0.7 },
              },
              translateY: {
                in: { from: 30, to: 0, start: 0.35, end: 0.45 },
                out: { from: 0, to: -20, start: 0.45, end: 0.55 },
              },
            },
            {
              selector: '#section-message-b',
              opacity: {
                in: { from: 0, to: 1, start: 0.35, end: 0.45 },
                out: { from: 1, to: 0, start: 0.6, end: 0.7 },
              },
              translateY: {
                in: { from: 30, to: 0, start: 0.35, end: 0.45 },
                out: { from: 0, to: -20, start: 0.45, end: 0.55 },
              },
            },
            {
              selector: '#section-message-c',
              scaleY: { in: { from: 0.5, to: 1, start: 0.4, end: 0.5 } },
            },
            {
              selector: '#section-message-d',
              scaleY: { in: { from: 0.5, to: 1, start: 0.4, end: 0.5 } },
            },
          ],
        },
        {
          type: 'sticky',
          selector: '#scroll-section-3',
          heightMultiple: 5,
          animationList: [
            {
              selector: '#blend-canvas',
              blendImage: {
                imagePathList: ['./images/a.jpg', './images/b.jpg'],
                end: 0.6,
                inAnimationType: BlendAnimation.CropSide,
                inRatio: 0.15,
                outAnimationType: BlendAnimation.Scale,
                outRatio: 0.4,
              },
            },
          ],
        },
      ],
    };
  },
  created(): void {
    const { animationList } = this.sceneList[0];
    if (animationList) {
      const imagePathList = animationList[0].videoImage?.imagePathList;
      if (imagePathList) {
        for (let i = 0; i < 300; i++) {
          const number = `${i + 1}`;
          imagePathList.push(`./video/cat/cat${number.padStart(5, '0')}.JPG`);
        }
      }
    }
    const { animationList: animationList1 } = this.sceneList[2];
    if (animationList1) {
      const imagePathList = animationList1[0].videoImage?.imagePathList;
      if (imagePathList) {
        for (let i = 0; i < 388; i++) {
          const number = `${i + 1}`;
          imagePathList.push(`./video/digital/digital${number.padStart(5, '0')}.JPG`);
        }
      }
    }
  },
  methods: {
    test(scrollRatio: number): void {
      console.log(scrollRatio);
    },
  },
});
</script>

<style lang="scss" scoped>
.title {
  position: relative;
  z-index: 5;
  font-size: 4rem;
  text-align: center;
}

.message {
  display: flex;
  align-items: center;
  justify-content: center;
  top: 35vh;
  height: 3em;
  font-size: 2.5rem;
  opacity: 0;

  p {
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    color: coral;
  }
}

.description {
  margin: 0 auto;
  padding: 0 1rem;
  font-size: 1.2rem;
  color: coral;
}

.second-message {
  width: 30%;
  font-weight: bold;
  opacity: 0;
  color: coral;

  &.a {
    top: 10%;
    left: 60%;
  }

  &.b {
    top: 60%;
    left: 10%;
  }
}

.pin {
  width: 1px;
  height: 50px;
  background: coral;
}

.blend-style {
  width: 75vw;
  height: 50vw;
}
</style>
