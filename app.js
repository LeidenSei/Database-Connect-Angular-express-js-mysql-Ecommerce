const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const conn = require('./moldules/mysql');
const cors = require('cors');
const upLoadfile = require('./util/upLoad');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
app.use(bodyParser.json());
app.use(express.static('public/uploads'))
app.use(cors({
    origin: '*'
}));
conn.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối:', err);
        return;
    }
    console.log('Kết nối thành công!');
});

function kiemTraKetNoi() {
    console.log('Kết nối đến cơ sở dữ liệu đã được thiết lập.');
}

//category
app.get('/api/category', (req, res) => {
    conn.query(`Select * from category`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.post('/api/category', (req, res) => {
    conn.query(`Insert into category (name) values ('${req.body.name}')`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.delete('/api/category/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Delete from category Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.get('/api/category/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Select * from category Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data[0])
        }
    })
})


app.put('/api/category/:id', (req, res) => {
    let id = req.params.id;
    conn.query(`UPDATE category SET  name='${req.body.name}' WHERE id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})


//product
app.post('/api/product', upLoadfile.single('image'), (req, res) => {
    let fileName = req.protocol + '://' + req.get('host') + '/' + req.file.originalname;
    let sql = `
        INSERT INTO product (name, slug, description, price, short_detail, product_quantity, image, category_id, status) 
        VALUES ('${req.body.name}', '${req.body.slug}', '${req.body.description}',
        '${req.body.price}', '${req.body.short_detail}', '${req.body.product_quantity}',
        '${fileName}', ${req.body.category_id}, ${req.body.status})
    `;
    conn.query(sql, (err, data) => {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            res.json(data);
        }
    });
});

app.put('/api/product/:id', upLoadfile.single('image'), (req, res) => {
    let fileName = req.body.image;

    if (req.file) {
        fileName = req.protocol + '://' + req.get('host') + '/' + `${req.file.filename}`;
    }
    conn.query(`UPDATE product SET  name='${req.body.name}',slug = '${req.body.slug}', description = '${req.body.description}',
         price=${req.body.price}, product_quantity = '${req.body.product_quantity}', short_detail = '${req.body.short_detail}', image='${fileName}',category_id=${req.body.category_id},
         status =  ${req.body.status}
          WHERE id = ${req.params.id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
            console.log(err);
        } else {
            res.json(data)
        }
    })
})
app.get('/api/product', (req, res) => {
    conn.query(`Select product.*,category.name as 'category' from product join category on product.category_id=category.id`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
//shop
app.get('/api/shop', (req, res) => {
    const query = `
        SELECT 
            product.*, 
            category.name AS 'category',
            COUNT(product_ratings.rating_star) AS rating_count,
            AVG(product_ratings.rating_star) AS rating_avg,
            (AVG(product_ratings.rating_star) / 5) * 100 AS average_rating_percentage
        FROM 
            product 
        JOIN 
            category ON product.category_id = category.id
        LEFT JOIN 
            product_ratings ON product.id = product_ratings.product_id
        WHERE 
            product.status = 1
        GROUP BY 
            product.id;
    `;

    conn.query(query, (err, data) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.json(data);
        }
    });
});


app.get('/api/shop/product-name/:name', (req, res) => {
    let name = req.params.name;
    let searchTerm = '%' + name + '%';
    conn.query(
        `SELECT product.*, category.name AS 'category' 
         FROM product 
         JOIN category ON product.category_id = category.id 
         WHERE product.name LIKE ? AND product.status = 1`,
        [searchTerm],
        (err, data) => {
            if (err) {
                console.error('Error fetching products:', err);
                res.sendStatus(500);
            } else {
                res.json(data);
            }
        }
    );
});
app.get('/api/shop/category-count', (req, res) => {
    const query = `
        SELECT c.*, COUNT(p.id) as product_count
        FROM category c
        LEFT JOIN product p ON c.id = p.category_id where p.status = 1  
        GROUP BY c.id;
    `;
    conn.query(query, (err, data) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.json(data);
        }
    });
});


app.get('/api/product/4_recent_product', (req, res) => {
    conn.query(
        `SELECT product.*, category.name as 'category' 
         FROM product 
         JOIN category ON product.category_id = category.id and product.status = 1
         ORDER BY product.id DESC 
         LIMIT 4`,
        (err, data) => {
            if (err) {
                res.sendStatus(500);
            } else {
                res.json(data);
            }
        }
    );
});

app.delete('/api/product/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Delete from product Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.get('/api/product/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Select * from product Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data[0])
        }
    })
})
app.get('/api/product/get_by/:slug', (req, res) => {
    let slug = req.params.slug;
    conn.query(`SELECT product.*, category.name as 'category' 
                FROM product 
                JOIN category ON product.category_id = category.id 
                WHERE product.slug = ?`, [slug], (err, data) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else if (data.length === 0) {
            res.sendStatus(404); 
        } else {
            res.json(data[0]);
        }
    });
});

app.get('/api/product/cate/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Select product.*,category.name as 'category' from product join category on product.category_id=category.id and product.category_id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.get('/api/product/only/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Select product.*,category.name as 'category' from product join category on product.category_id=category.id and product.id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data[0])
        }
    })
})

//customer
app.get('/api/user/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Select * from users Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data[0])
        }
    })
})
app.delete('/api/user/:id', (req, res) => {
    let id = req.params.id
    console.log(req);
    conn.query(`Delete from users Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.get('/api/users', (req, res) => {
    conn.query(`Select * from users`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.post('/api/user/register', async (req, res) => {
    try {
        const { fullname, phone_number, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);

        const sql = `INSERT INTO users (fullname, phone_number, email, password) VALUES (?, ?, ?, ?)`;
        const values = [fullname, phone_number, email, hashedPassword];

        conn.query(sql, values, (err, data) => {
            if (err) {
                console.error('Error inserting user into database:', err);
                res.sendStatus(500);
            } else {
                res.json({ message: 'User registered successfully', data });
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.sendStatus(500);
    }
});


app.post('/api/user/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        conn.query('SELECT id, fullname, phone_number, address, created_at, updated_at, is_active, date_of_birth, role_id, email, avatar, password FROM users WHERE email = ?', [email], async (err, data) => {
            if (err) {
                console.error('Error querying the database:', err);
                res.sendStatus(500);
            } else {
                if (data.length !== 1) {
                    res.sendStatus(403);    
                    return;
                }

                const storedUser = data[0];
                const isEqual = await bcrypt.compare(password, storedUser.password);
                if (!isEqual) {
                    res.status(403).json({ error: 'Wrong password' });
                    return;
                }

                const token = jwt.sign(
                    {
                        email: storedUser.email,
                        userId: storedUser.id,
                        role: storedUser.role_id == 1?'user':'admin',
                        is_active: storedUser.is_active == 1?'active':'disabled'
                    },
                    'secretfortoken',
                    { expiresIn: '1h' }
                );

                res.json({ token: token});
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.sendStatus(500);
    }
});app.put('/api/user/edit/:id', upLoadfile.single('avatar'), (req, res) => {
    let fileName = req.body.avatar;
    if (req.file) {
        fileName = req.protocol + '://' + req.get('host') + '/' + `${req.file.filename}`;
    }
    let dateOfBirth = req.body.date_of_birth ? new Date(req.body.date_of_birth).toISOString().split('T')[0] : null;

    let is_active = req.body.is_active ? 1 : 0;

    const sql = `
        UPDATE users 
        SET fullname = ?, 
            phone_number = ?, 
            address = ?,  
            date_of_birth = ?, 
            role_id = ?, 
            avatar = ?, 
            is_active = ? 
        WHERE id = ?
    `;

    const params = [
        req.body.fullname,
        req.body.phone_number,
        req.body.address,
        dateOfBirth,
        req.body.role_id,
        fileName,
        is_active,  
        req.params.id
    ];

    conn.query(sql, params, (err, data) => {
        if (err) {
            res.sendStatus(500);
            console.error(err);
        } else {
            res.json(data);
        }
    });
});


//order
app.get('/api/checkout-order/orders', (req, res) => {
    conn.query(`Select * from orders order by order_date desc`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})
app.get('/api/checkout-order/orders/:id', (req, res) => {
    let id = req.params.id;
    conn.query(`Select * from orders Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data[0])
        }
    })
})
app.post('/api/checkout-order', (req, res) => {

    conn.beginTransaction((err) => {
        if (err) {
            res.sendStatus(500);
            return;
        }

        const order = req.body;
        const orderValues = {
            user_id: order.user_id,
            fullname: order.fullname,
            email: order.email,
            phone_number: order.phone_number,
            address: order.address,
            note: order.note,
            total_money: order.total_money,
            payment_method: order.payment_method,
            shipping_method: order.shipping_method,
            avatar: order.avatar
        };

        conn.query('INSERT INTO orders SET ?', orderValues, (err, result) => {
            if (err) {
                conn.rollback(() => {
                    console.error('Error inserting into orders', err);
                    res.sendStatus(500);
                });
                return;
            }

            const orderId = result.insertId;

            const orderDetails = order.order_details.map(detail => [
                orderId,
                detail.product_id,
                detail.price,
                detail.number_of_product,
                detail.total_money
            ]);

            conn.query('INSERT INTO order_details (order_id, product_id, price, number_of_product, total_money) VALUES ?', [orderDetails], (err, result) => {
                if (err) {
                    conn.rollback(() => {
                        console.error('Error inserting into order_details', err);
                        res.sendStatus(500);
                    });
                    return;
                }

                conn.commit((err) => {
                    if (err) {
                        conn.rollback(() => {
                            console.error('Error committing transaction', err);
                            res.sendStatus(500);
                        });
                        return;
                    }

                    console.log('Transaction completed successfully');
                    res.json({ message: 'Order placed successfully' });
                });
            });
        });
    });
});

app.delete('/api/checkout-order/delete-order/:id', (req, res) => {
    let id = req.params.id
    console.log(id);
    conn.query(`Delete from orders Where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)
        }
    })
})

app.put('/api/checkout-order/set-status-order/:id', (req, res) => {
    let id = req.params.id;
    console.log(req.body);
    let status = req.body.status;
    let shipping_date = req.body.shipping_date;
    const query = `
      UPDATE orders
      SET
        status = ?,
        shipping_date = ?
      WHERE id = ?
    `;
  
    const values = [status, shipping_date, id];
  
    conn.query(query, values, (err, data) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(data);
      }
    });
});

app.get('/api/checkout-order/userId/:id', (req, res) => {
    let id = req.params.id

    conn.query(`Select * from orders Where user_id = ${id} order by order_date desc`, (err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.json(data)

        }
    })
})
app.get('/api/checkout-order/order-detail/:id', (req, res) => {
    let id = req.params.id;
    const query = `
        SELECT 
            order_details.*, 
            product.name AS product_name, 
            product.image AS product_image,
            product.price AS product_price
        FROM order_details 
        JOIN product ON order_details.product_id = product.id 
        WHERE order_details.order_id = ?
    `;

    conn.query(query, [id], (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            if (data.length === 0) {
                res.status(404).json({ error: 'Order not found' });
            } else {
                res.status(200).json(data);
            }
        }
    });
});
//rating
app.post('/api/rating', (req, res) => {
    const userId = req.body.user_id ? req.body.user_id : 'NULL';
    const productId = req.body.product_id ? req.body.product_id : 'NULL';
    const ratingStar = req.body.rating_star ? req.body.rating_star : 'NULL';
  
    const query = `
      INSERT INTO product_ratings (user_id, fullname, email, product_id, rating_star, comment_product, avatar)
      VALUES (
        ${userId},
        '${req.body.fullname || ''}',
        '${req.body.email || ''}',
        ${productId},
        ${ratingStar},
        '${req.body.comment_product || ''}',
        '${req.body.avatar || ''}'
      )
    `;
  
    conn.query(query, (err, data) => {
      if (err) {
        res.sendStatus(500);
        console.log(err);
      } else {
        if (data.affectedRows > 0) {
          res.json({ message: 'Comment added successfully' });
        } else {
          res.sendStatus(403);
        }
      }
    });
  });
  
  app.get('/api/rating-products/:id', (req, res) => {
    let id = req.params.id;
    conn.query(`SELECT * FROM product_ratings WHERE product_id = ${id} ORDER BY created_date DESC`, (err, data) => {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            if (data.length > 0) {
                res.json(data);
            } else {
                res.sendStatus(403);
            }
        }
    });
});

app.get('/api/rating/:id', (req, res) => {
    let id = req.params.id
    conn.query(`Select * from product_ratings where id = ${id}`, (err, data) => {
        if (err) {
            res.sendStatus(500)
            console.log(err);
        } else {
            if (data.length > 0) {
                res.json(data)
            } else {
                res.sendStatus(403)
            }
        }
    })
})
//role
app.get('/api/roles',(req, res) => {
    conn.query(`Select * from roles`, (err, data) => {
        if(err){
            res.sendStatus(500);
            console.log(err);
        } else{
            res.json(data)
        }
    })
})
//contact
app.post('/api/contacts', (req, res) => {
    const { message, user_id, fullname, phone_number, email } = req.body;

    const query = `
        INSERT INTO contact (message, user_id, fullname, phone_number, email)
        VALUES (?, ?, ?, ?, ?)
    `;
    conn.query(query, [message, user_id || null, fullname, phone_number, email], (err, data) => {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            res.json(data);
        }
    });
});

app.get('/api/contacts', (req, res) => {
    conn.query(`SELECT * FROM contact ORDER BY created_at DESC`, (err, data) => {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            res.json(data);
        }
    });
});
app.get('/api/contacts/:id', (req, res) => {
    let id = req.params.id
    conn.query(`SELECT * FROM contact where id = ${id} `, (err, data) => {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            res.json(data[0]);
        }
    });
});
app.post('/api/contacts/delete', (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send('Invalid request');
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM contact WHERE id IN (${placeholders})`;

    conn.query(sql, ids, (err, result) => {
        if (err) {
            res.sendStatus(500);
            console.log(err);
        } else {
            res.json({ message: 'Contacts deleted successfully' });
        }
    });
});

app.listen(3000, () => { }) 