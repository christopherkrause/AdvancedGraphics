/**
 * Created by KrauseC on 11/20/16.
 */
var superquad = {
    N : 100,
    M : 100,
    n : 1.4,
    m : 4,

    verts : null,
    normals : null,
    texCoords : null,

    // var powerV = Math.pow(Math.abs(Math.cos(v)), 2/m-1);
    // var powerU = Math.pow(Math.abs(Math.cos(u)), 2/n-1);
    // var powerV = Math.pow(Math.abs(Math.sin(u)), 2/n-1);
    // var powerU = Math.pow(Math.abs(Math.sin(v)), 2/n-1);


    power : function(x, y){
        return Math.pow(Math.abs(x), y);
    },

    x : function(m, n, u, v) {
        //var power = Math.pow(Math.abs(Math.cos(v)), 2/m-1);
        return Math.cos(v)*this.power(Math.cos(v), 2/m-1)
            *Math.cos(u)*this.power(Math.cos(u), 2/n-1);
    },
    y : function(m, n, u, v) {
        return Math.cos(v)*this.power(Math.cos(v), 2/m-1)
            *Math.sin(u)*this.power(Math.sin(u), 2/n-1);
    },
    z : function(m, v) {
        return Math.sin(v)*this.power(Math.sin(v), 2/m-1);
    },
    N_x : function(m, n, u, v) {
        return Math.cos(v)*this.power(Math.cos(v), 2-2/m-1)
            *Math.cos(u)*this.power(Math.cos(u), 2-2/n-1);
    },
    N_y : function(m, n, u, v) {
        return Math.cos(v)*this.power(Math.cos(v), 2-2/m-1)
            *Math.sin(u)*this.power(Math.sin(u), 2-2/n-1);
        },
    N_z : function(m, v) {
            return Math.sin(v)*this.power(Math.sin(v), 2-2/m-1);
        },
    // zj : function(u, v){
    //   return
    // },


    //inclass torus and toroidal spiral geometry code
    createGeometry : function() {
        var N = this.N, M = this.M;
        var numFloats = 3*(N+1)*(M+1);
        var v = -Math.PI/2; u = -Math.PI;
        dv = 2*Math.abs(v)/N, du = 2*Math.PI/M;
        if (!this.verts || this.verts.length != numFloats){
            this.verts = new Float32Array(numFloats);
            this.normals = new Float32Array(numFloats);
            this.texCoords = new Float32Array(2*(N+1)*(M+1));
        }
        var n = 0; //verts & normals index

        //populate verts & normals
        for (var i = 0; i <= N; i++, v+=dv){
            var u = -Math.PI;
            for (var j = 0; j <= M; j++, u+=du){
                if  (j == M) u = -Math.PI;
                this.verts[n] = this.x(this.m,this.n,u,v);
                this.verts[n+1] = this.y(this.m,this.n,u,v);
                this.verts[n+2] = this.z(this.m,v);
                this.normals[n] = this.N_x(this.m,this.n,u,v);
                this.normals[n+1] = this.N_y(this.m,this.n,u,v);
                this.normals[n+2] = this.N_z(this.m,v);
                n += 3;

            }
        }


        //var m, n= 2*(M+1)+2; //non-polar strips
        var m = 2*(M+1)+2;
        var n = 3*(M+1) + 3;

        //cals s vals
        //following project assignment
        for (var i = 0; i < N; i++){
            var d = new Float32Array(M+1);
            d[0] = 0;

            var distance = 0;
            for (var j = 1; j <= M; j++){
                x_s = this.verts[n] - this.verts[n-3];
                y_s = this.verts[n+1] - this.verts[n-2];
                z_s = this.verts[n+2] - this.verts[n-1];
                //okay
                //calc E
                var E_s = x_s*x_s + y_s*y_s + z_s*z_s;
                d[j] = Math.sqrt(E_s);
                n += 3;
                distance += d[j];
            }
            //calcule s values 
            for (var w = 1; w <= M; w++){
                var partial = 0;

                for (var h = 0; h <= w; h++){
                    partial += d[h];
                }
                var s = partial/distance;
                this.texCoords[m] = s;
                m += 2;
            }
            m += 2;
            n += 3;
        }

        for (var l = 0; l <= M; l++){
            this.texCoords[2*l] = this.texCoords[(2*(M+1)) + 2*l];
            this.texCoords[N*(2*(M+1)) + 2*l] = this.texCoords[(N-1)*(2*(M+1)) + 2*l];
        }

        //calc t vals
        for (var j = 0; j < M; j++){
            var d = new Float32Array(N+1);
            d[0] = 0;
            var distance = 0;
            for (var i = 1; i <= N; i++){
                var x_t = this.verts[i*3*(M+1)+3*j] - this.verts[(i-1)*3*(M+1)+3*j];
                var y_t = this.verts[i*3*(M+1)+3*j+1] - this.verts[(i-1)*3*(M+1)+3*j+1];
                var z_t = this.verts[i*3*(M+1)+3*j+2] - this.verts[(i-1)*3*(M+1)+3*j+2];

                var E_t = x_t*x_t + y_t*y_t + z_t*z_t;
                d[i] = Math.sqrt(E_t);
                distance += d[i];
            }
            for (var w = 0; w <= N; w++){
                var partial = 0;
                for (var h = 0; h <= w; h++){
                    partial += d[h];
                }
                this.texCoords[w*2*(M+1)+(2*j)+1] = partial/distance;
            }
        }
        for (var y = 0; y <= N; y++){
            this.texCoords[y*2*(M+1) + 2*M+1] = this.texCoords[y*2*(M+1)+1];
        }
    },
    triangleStrip: null,

    //Same as noisy toroidal spiral
    createTriangleStrip : function() {
        var M = this.M, N = this.N;
        var numIndices = N*(2*(M+1)+2)-2;
        if (!this.triangleStrip || this.triangleStrip.length != numIndices){
            this.triangleStrip = new Uint16Array(numIndices);
        }
        var index = function(i, j){
            return i*(M+1) + j;
        }
        var n = 0;
        for (var i = 0; i < N; i++){
            if (i > 0){
                this.triangleStrip[n++] = index(i,0);
            }
            for (var j = 0; j <= M; j++){
                this.triangleStrip[n++] = index(i, j);
                this.triangleStrip[n++] = index(i+1,j);
            }
            if (i < N-1){
                this.triangleStrip[n++] = index(i,M);
            }
        }

    },
};
