/*
  TODO:
  [ ] make edit page

  OPTIMIZE:

  FIXME:
  
*/

var isDataloaded = false;
var dataArray = [];
var dataArray_filter = [];
var current_page = "shelf";
var current_bookNumber = null;
var current_bookShelf = "Bedroom Main";
var isEdit = false;

// #region : tools

// lazy img load - blur effect
const lazy_image = () => {
  let lazyImages = document.querySelectorAll("img.lazy-img");

  let lazyLoad = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.getAttribute("data-src");
          lazyImage.classList.add("loaded");
          lazyLoad.unobserve(lazyImage);
        }
      });
    },
    { threshold: 0.01 }
  );

  lazyImages.forEach(function (lazyImage) {
    lazyLoad.observe(lazyImage);
  });
};

// #endregion

// #region : load data

// load data from google sheet
const loadData_googleSheet = () => {
  let SHEET_ID = "1zLSnZ7vBBJf9QFpM1mQIQSB9WepuFUSogu23Wd3ntAY";
  let SHEET_TITLE = "Book lists";
  let SHEET_RANGE = "A1:L2000";

  dataArray = [];
  isDataloaded = false;

  let FULL_URL =
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/gviz/tq?sheet=" +
    SHEET_TITLE +
    "&range=" +
    SHEET_RANGE;

  fetch(FULL_URL)
    .then((res) => res.text())
    .then((rep) => {
      let data = JSON.parse(rep.substr(47).slice(0, -2));
      let outputdata = data.table.rows;

      // dataArray
      var rowKey = [
        "Name",
        "Author",
        "Category",
        "Publisher",
        "ISBN",
        "Cover",
        "Status",
        "Bag",
        "Locate",
        "Img",
        "Star",
        "Description",
        "Note",
      ];
      for (let i = 0; i < data.table.rows.length; i++) {
        var rowData = {};
        for (let j = 0; j < rowKey.length; j++) {
          var parseObj = outputdata[i].c[j];
          var parseData = parseObj == null ? "" : parseObj.v;
          parseData = parseData == null ? "" : parseData;
          rowData[rowKey[j]] = parseData;
        }

        // trim data
        for (const key in rowData) {
          if (rowData.hasOwnProperty(key)) {
            if (typeof rowData[key] === "string") {
              rowData[key] = rowData[key].trim();
            } else if (typeof rowData[key] === "object") {
              trimObjectValues(rowData[key]); // Recursively trim nested objects
            }
          }
        }
        dataArray.push(rowData);
        dataArray_filter.push(rowData);
      }

      isDataloaded = true;
      document.querySelector("#shelf_colorBtn").style.display = "flex";
      document.querySelector("#shelf_chartBtn").style.display = "flex";
      generate_bookshelf();
    })
    .catch((error) => {
      console.log("fetch google sheet fail");
      loadData_manual();
    });
};
loadData_googleSheet();

// load data manual
const loadData_manual = () => {
  const alert_noData = document.querySelector("#alert_noData");
  alert_noData.style.display = "flex";

  // CSV file reader
  const csvToDataObj = (csv) => {
    return new Promise((resolve, reject) => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          reject(error.message);
        },
      });
    });
  };
  const handleFile = (result) => {
    dataArray = [...result];
    dataArray_filter = [...result];

    alert_noData.style.display = "none";
    isDataloaded = true;
    document.querySelector("#shelf_colorBtn").style.display = "flex";
    generate_bookshelf();
  };

  // click to load file
  alert_noData.querySelector("div").addEventListener("click", () => {
    const file = document.createElement("input");
    file.type = "file";
    file.accept = ".csv";
    file.click();
    file.addEventListener("change", () => {
      csvToDataObj(file.files[0]).then((result) => {
        handleFile(result);
      });
    });
  });

  // drop to load file
  alert_noData.addEventListener("drop", (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (file) {
      csvToDataObj(file).then((result) => {
        handleFile(result);
      });
    }
  });
  alert_noData.addEventListener("dragover", (e) => {
    e.preventDefault();
    document.querySelector("#alert_noData > div").style.backgroundColor = "#ede5d5";
  });
  alert_noData.addEventListener("dragleave", (e) => {
    e.preventDefault();
    document.querySelector("#alert_noData > div").style.backgroundColor = null;
  });
};

// #endregion

// #region : page change
const btn_shelf = document.querySelector("#btn_shelf");
const btn_book = document.querySelector("#btn_book");
const btn_gallery = document.querySelector("#btn_gallery");
const btn_edit = document.querySelector("#btn_edit");

const page_change = (page) => {
  const shelf = document.querySelector("#shelf");
  const book = document.querySelector("#book");
  const gallery = document.querySelector("#gallery");
  const edit = document.querySelector("#edit");

  // hide scrollTop btn (use in gallery page)
  if (page != "gallery") document.querySelector("#btn_scrollTop").style.display = "none";

  switch (page) {
    case "shelf":
      shelf.style.display = "flex";
      book.style.display = "none";
      gallery.style.display = "none";
      edit.style.display = "none";
      btn_shelf.className = "btn selected";
      btn_book.className = "btn";
      btn_gallery.className = "btn";
      btn_edit.className = "btn";
      current_page = "shelf";
      break;
    case "book":
      shelf.style.display = "none";
      book.style.display = "flex";
      gallery.style.display = "none";
      edit.style.display = "none";
      btn_shelf.className = "btn";
      btn_book.className = "btn selected";
      btn_gallery.className = "btn";
      btn_edit.className = "btn";
      current_page = "book";
      break;
    case "gallery":
      shelf.style.display = "none";
      book.style.display = "none";
      gallery.style.display = "flex";
      edit.style.display = "none";
      btn_shelf.className = "btn";
      btn_book.className = "btn";
      btn_gallery.className = "btn selected";
      btn_edit.className = "btn";
      current_page = "gallery";
      break;
    case "edit":
      shelf.style.display = "none";
      book.style.display = "none";
      gallery.style.display = "none";
      edit.style.display = "flex";
      btn_shelf.className = "btn";
      btn_book.className = "btn";
      btn_gallery.className = "btn";
      btn_edit.className = "btn selected";
      current_page = "edit";
      break;
  }
};

btn_shelf.addEventListener("click", () => {
  page_change("shelf");

  // highlight book
  if (current_bookNumber != null) highlight_bookshelf(current_bookNumber);
  else generate_bookshelf(current_bookShelf);
});

btn_book.addEventListener("click", () => {
  if (btn_book.className.includes("selected") || current_bookNumber == null)
    current_bookNumber = Math.floor(Math.random() * dataArray_filter.length);
  page_change("book");
  generate_book(current_bookNumber);
});

btn_gallery.addEventListener("click", () => {
  page_change("gallery");
  if (document.querySelector("#gallery").innerHTML == "") generate_bookgallery();
});

btn_edit.addEventListener("click", () => {
  page_change("edit");
});

// #endregion

// #region : search

// search filter
var searchBy = "name";
const filter_search = (type) => {
  const searchBy_lists = document.querySelectorAll("#filterBar > .column:first-child > div.row");
  searchBy_lists.forEach((list) => {
    list.querySelector(".material-symbols-outlined").textContent = " radio_button_unchecked ";
  });
  searchBy = type;
  generate_filter_lists();
  switch (type) {
    case "name":
      searchBy_lists[0].querySelector(".material-symbols-outlined").textContent = " radio_button_checked ";
      break;
    case "author":
      searchBy_lists[1].querySelector(".material-symbols-outlined").textContent = " radio_button_checked ";
      break;
    case "category":
      searchBy_lists[2].querySelector(".material-symbols-outlined").textContent = " radio_button_checked ";
      break;
    case "publisher":
      searchBy_lists[3].querySelector(".material-symbols-outlined").textContent = " radio_button_checked ";
      break;
    case "isbn":
      searchBy_lists[4].querySelector(".material-symbols-outlined").textContent = " radio_button_checked ";
      break;
  }
};

// update filter lists
const toggle_filter_checkbox = (dom) => {
  const checkbox = dom.querySelector("span");
  checkbox.textContent = checkbox.textContent == " check_box " ? " check_box_outline_blank " : " check_box ";
  const filter_lists = document.querySelectorAll("#filterBar > .column:nth-child(2) > .filter_content");

  // filtering data
  if (Array.from(filter_lists).some((element) => element.innerHTML.includes("check_box_outline_blank"))) {
    document.querySelector("#btn_filter").style.backgroundColor = "#3a3967";

    // create filter array
    const isCheck = (i, j) => {
      return (
        filter_lists[i].childNodes[j].querySelector(".material-symbols-outlined").textContent.trim() ==
        "check_box"
      );
    };
    const check_filter = [[], [], [], []];
    for (let i = 0; i < filter_lists.length; i++) {
      for (let j = 0; j < filter_lists[i].childElementCount; j++) {
        if (isCheck(i, j))
          check_filter[i].push(filter_lists[i].children[j].querySelector("span:nth-child(2)").textContent);
      }
    }

    // filter data
    dataArray_filter = dataArray.filter((item) => {
      return check_filter.every((filter, index) => {
        if (filter.length === 0) {
          return true;
        }

        var key = document
          .querySelectorAll("#filterBar > .column:nth-child(2) > div.row.click")
          [index].querySelector("span:first-child").textContent;
        // if (!key || item[key] === undefined) return false;

        // mapping key to data
        if (key == "Category") key = "Category";
        else if (key == "Location") key = "Locate";
        else if (key == "Reading") key = "Status";
        else if (key == "Cover") key = "Cover";

        if (key == "Locate") {
          const room = item.Locate.match(/^(.*?)\s\d+-\d+$/);
          if (room == null) return false;
          const check = room[1].trim();
          return filter.includes(check);
        } else {
          return filter.includes(item[key]);
        }
      });
    });
  } else {
    document.querySelector("#btn_filter").style.backgroundColor = null;
    dataArray_filter = dataArray;
  }

  // update filter - each page TODO:
  if (document.querySelector("#btn_book").className == "btn selected") {
  } else if (document.querySelector("#btn_book").className == "btn selected") {
  } else if (document.querySelector("#btn_gallery").className == "btn selected") {
    page_change("gallery");
    document.querySelector("#gallery").innerHTML = "";
    gallery_bookCount = 0;
    generate_bookgallery();
  }
};

// toggle filter hide/show
const toggle_filter_list = () => {
  const filterBar = document.querySelector("#filterBar");
  filterBar.style.display = filterBar.style.display == "flex" ? "none" : "flex";
  if (filterBar.style.display == "flex") document.querySelector("#searchBar").style.display = "none";
  if (filterBar.style.display == "none")
    document
      .querySelectorAll("#filterBar > .column:nth-child(2) > .filter_content")
      .forEach((list) => (list.style.maxHeight = null));
};
document.querySelector("#btn_filter").addEventListener("click", toggle_filter_list);

// clear filter lists
const clear_filter_list = () => {
  document
    .querySelectorAll(
      "#filterBar > .column:nth-child(2) > .filter_content > div.row.click > span.material-symbols-outlined"
    )
    .forEach((item) => (item.textContent = " check_box "));
  document.querySelector("#btn_filter").style.backgroundColor = null;
};
let expired;
const doubleTouch = (e) => {
  if (e.touches.length === 1) {
    if (!expired) {
      expired = e.timeStamp + 400;
    } else if (e.timeStamp <= expired) {
      e.preventDefault();
      clear_filter_list();
      expired = null;
    } else {
      expired = e.timeStamp + 400;
    }
  }
};
document.querySelector("#btn_filter").addEventListener("dblclick", clear_filter_list);
document.querySelector("#btn_filter").addEventListener("touchstart", doubleTouch);

// generate filter lists
const generate_filter_lists = (type) => {
  const filter_lists = document.querySelectorAll("#filterBar > .column:nth-child(2) > .filter_content");
  var filter_array = [];
  switch (type) {
    case "category":
      if (filter_lists[0].textContent != "") break;
      for (let i = 0; i < dataArray.length; i++) {
        if (!filter_array.includes(dataArray[i].Category)) filter_array.push(dataArray[i].Category);
      }
      break;
    case "location":
      if (filter_lists[1].textContent != "") break;
      for (let i = 0; i < dataArray.length; i++) {
        const room = dataArray[i].Locate.match(/^(.*?)\s\d+-\d+-\d+$/);
        if (room == null) continue;
        if (!filter_array.includes(room[1].trim())) filter_array.push(room[1].trim());
      }
      break;
    case "reading":
      if (filter_lists[2].textContent != "") break;
      for (let i = 0; i < dataArray.length; i++) {
        if (!filter_array.includes(dataArray[i].Status)) filter_array.push(dataArray[i].Status);
      }
      break;
    case "cover":
      if (filter_lists[3].textContent != "") break;
      for (let i = 0; i < dataArray.length; i++) {
        if (!filter_array.includes(dataArray[i].Cover)) filter_array.push(dataArray[i].Cover);
      }
      break;
  }
  filter_array = filter_array.filter((obj) => obj.trim().length > 0);

  const list_toNum = (list) => {
    switch (list) {
      case "category":
        return 0;
      case "location":
        return 1;
      case "reading":
        return 2;
      case "cover":
        return 3;
    }
  };

  if (filter_array.length > 0) {
    // generate filter lists
    var filter_gen = "";
    for (let i = 0; i < filter_array.length; i++) {
      filter_gen += `<div class="row click" onclick="toggle_filter_checkbox(this)"><span class="material-symbols-outlined"> check_box </span><span>${filter_array[i]}</span></div>`;
    }
    for (let i = 0; i < 4; i++) filter_lists[i].style.maxHeight = null;
    filter_lists[list_toNum(type)].innerHTML = filter_gen;
    filter_lists[list_toNum(type)].style.maxHeight = filter_lists[list_toNum(type)].scrollHeight + "px";
  } else {
    // toggle filter lists
    for (let i = 0; i < 4; i++) {
      filter_lists[i].style.maxHeight = filter_lists[i].style.maxHeight
        ? null
        : filter_lists[i].scrollHeight + "px";
      if (i == list_toNum(type)) continue;
      filter_lists[i].style.maxHeight = null;
    }
  }
};

// search box (search result)
const search_box = document.querySelector("#input_searchBox");
search_box.addEventListener("click", () => {
  const filterBar = document.querySelector("#filterBar");
  filterBar.style.display = "none";
  searchbox_Search();
  document.querySelector("#searchBar").style.display = "flex";
});
const searchbox_Search = () => {
  if (!isDataloaded) return;

  const value = search_box.value.trim().toLowerCase();
  const search_array = [];
  const search_bar = document.querySelector("#searchBar");

  if (value == "") {
    search_bar.innerHTML = "";
    return;
  }

  const searchKey = (search_by) => {
    switch (search_by) {
      case "name":
        return "Name";
      case "author":
        return "Author";
      case "category":
        return "Category";
      case "publisher":
        return "Publisher";
      case "isbn":
        return "ISBN";
    }
  };

  // do search
  for (let i = 0; i < dataArray_filter.length; i++) {
    if (searchBy == "isbn") {
      if (dataArray_filter[i][searchKey(searchBy)].split("-").join("").includes(value.split("-").join("")))
        search_array.push({
          Name: dataArray_filter[i].Name,
          Author: dataArray_filter[i].Author,
          Category: dataArray_filter[i].Category,
          Publisher: dataArray_filter[i].Publisher,
          Status: dataArray_filter[i].Status,
          Cover: dataArray_filter[i].Cover,
          Bag: dataArray_filter[i].Bag,
          Locate: dataArray_filter[i].Locate,
          Img: dataArray_filter[i].Img,
          Locate: dataArray_filter[i].Locate,
          Note: dataArray_filter[i].Note,
          Star: dataArray_filter[i].Star,
          ISBN: dataArray_filter[i].ISBN,
          No: i,
        });
    } else {
      if (dataArray_filter[i][searchKey(searchBy)].toLowerCase().includes(value))
        search_array.push({
          Name: dataArray_filter[i].Name,
          Author: dataArray_filter[i].Author,
          Category: dataArray_filter[i].Category,
          Publisher: dataArray_filter[i].Publisher,
          Status: dataArray_filter[i].Status,
          Cover: dataArray_filter[i].Cover,
          Bag: dataArray_filter[i].Bag,
          Locate: dataArray_filter[i].Locate,
          Img: dataArray_filter[i].Img,
          Locate: dataArray_filter[i].Locate,
          Note: dataArray_filter[i].Note,
          Star: dataArray_filter[i].Star,
          ISBN: dataArray_filter[i].ISBN,
          No: i,
        });
    }
    if (search_array.length >= 5) break;
  }
  search_bar.innerHTML = "";
  if (search_array.length <= 0) {
    return;
  }
  search_bar.style.display = "flex";
  switch (current_page) {
    case "shelf":
      for (let i = 0; i < search_array.length; i++)
        search_bar.innerHTML += `<div onclick="highlight_bookshelf(${search_array[i].No});document.querySelector('#searchBar').style.display = 'none';" class="row">${search_array[i].Name}</div>`;
      break;
    case "edit":
      break;
    default:
      for (let i = 0; i < search_array.length; i++)
        search_bar.innerHTML += `<div onclick="search_book(${search_array[i].No})" class="row">${search_array[i].Name}</div>`;
  }
};
search_box.addEventListener("input", searchbox_Search);

// hide box - search and filter
document.addEventListener("click", (e) => {
  const filterBar = document.querySelector("#filterBar");
  const searchBar = document.querySelector("#searchBar");
  const filterBar_box = filterBar.getBoundingClientRect();
  const searchBar_box = searchBar.getBoundingClientRect();

  if (
    filterBar.style.display == "flex" &&
    (e.clientX > filterBar_box.right ||
      e.clientX < filterBar_box.left ||
      e.clientY > filterBar_box.bottom ||
      e.clientY < filterBar_box.top) &&
    e.target != document.querySelector("#btn_filter") &&
    e.target.parentNode != document.querySelector("#btn_filter")
  ) {
    filterBar.style.display = "none";
    document
      .querySelectorAll("#filterBar > .column:nth-child(2) > .filter_content")
      .forEach((list) => (list.style.maxHeight = null));
  }

  if (
    searchBar.style.display == "flex" &&
    (e.clientX > searchBar_box.right ||
      e.clientX < searchBar_box.left ||
      e.clientY > searchBar_box.bottom ||
      e.clientY < searchBar_box.top) &&
    e.target != document.querySelector("#input_searchBox")
  )
    searchBar.style.display = "none";
});

// #endregion

// #region : page - shelf

// shelf drop down menu
const shelf_name = document.querySelector("#shelf_name");
const shelf_list = document.querySelector("#shelf_lists");
shelf_name.addEventListener("click", () => {
  shelf_list.style.display = shelf_list.style.display == "flex" ? "none" : "flex";
});

// close shelf drop down
document.addEventListener("click", (e) => {
  if (shelf_list.style.display != "flex") return;
  if (e.target == shelf_name) return;

  const shelf_list_box = shelf_list.getBoundingClientRect();
  if (
    e.clientX < shelf_list_box.left ||
    e.clientX > shelf_list_box.right ||
    e.clientY < shelf_list_box.top ||
    e.clientY > shelf_list_box.bottom
  ) {
    shelf_list.style.display = "none";
  }
});

// shelf colored drop down menu
const shelfColor_name = document.querySelector("#btn_shelf_color");
const shelfColor_list = document.querySelector("#shelfColor_lists");
shelfColor_name.addEventListener("click", () => {
  shelfColor_list.style.display = shelfColor_list.style.display == "flex" ? "none" : "flex";
});

// close shelf colored drop down
document.addEventListener("click", (e) => {
  if (shelfColor_list.style.display != "flex") return;
  if (e.target == shelfColor_name || e.target.parentNode == shelfColor_name) return;

  const shelfColor_list_box = shelfColor_list.getBoundingClientRect();
  if (
    e.clientX < shelfColor_list_box.left ||
    e.clientX > shelfColor_list_box.right ||
    e.clientY < shelfColor_list_box.top ||
    e.clientY > shelfColor_list_box.bottom
  ) {
    shelfColor_list.style.display = "none";
  }
});

// open chart
const shelfChart_name = document.querySelector("#btn_shelf_chart");
const shelfChart_list = document.querySelector("#shelfChart_lists");
shelfChart_name.addEventListener("click", () => {
  if (shelf_highlight == "none") return;
  shelfChart_list.style.display = shelfChart_list.style.display == "flex" ? "none" : "flex";
  generate_chart();
});

// close chart
document.addEventListener("click", (e) => {
  if (shelfChart_list.style.display != "flex") return;
  if (e.target == shelfChart_name || e.target.parentNode == shelfChart_name) return;

  const shelfChart_list_box = shelfChart_list.getBoundingClientRect();
  if (
    e.clientX < shelfChart_list_box.left ||
    e.clientX > shelfChart_list_box.right ||
    e.clientY < shelfChart_list_box.top ||
    e.clientY > shelfChart_list_box.bottom
  ) {
    shelfChart_list.style.display = "none";
  }
});

// generate shelf
var shelf_bookArray = [];
const generate_bookshelf = (shelf_name = "Bedroom Main") => {
  if (!isDataloaded) return;
  const shelf = document.querySelector("#shelf");
  const shelf_area = document.querySelector("#shelf_area");
  const shelfData = [
    { name: "Dad Lower", row: 2, col: 1 },
    { name: "Mom Front", row: 1, col: 1 },
    { name: "Mom Back", row: 4, col: 3 },
    { name: "Mom TV", row: 2, col: 2, nest: [true, false] },
    { name: "Bedroom Main", row: 4, col: 1 },
    { name: "Bedroom Bed", row: 2, col: 6 },
  ];

  document.querySelector("#shelf_name").textContent = shelf_name;
  shelf_list.innerHTML = "";

  // generate color lists
  const shelfColor = ["None", "Reading", "Cover", "Bag", "Category"];
  if (shelfColor_list.childElementCount == 0) {
    shelfColor.forEach((el, i) => {
      if (i == 0)
        document.querySelector("#shelfColor_lists").innerHTML += `<div class="selected">${el}</div>`;
      else document.querySelector("#shelfColor_lists").innerHTML += `<div>${el}</div>`;
    });
  }

  // generate shelf
  shelf_area.innerHTML = "";
  var shelf_row;
  var shelf_col;
  var shelf_nest;
  for (let i = 0; i < shelfData.length; i++) {
    if (shelfData[i].name == shelf_name) {
      shelf_row = shelfData[i].row;
      shelf_col = shelfData[i].col;
      shelf_nest = shelfData[i].nest != undefined ? shelfData[i].nest : null;

      document.querySelector("#shelf_lists").innerHTML += `<div class="selected">${shelfData[i].name}</div>`;

      // generate shelf
      shelf_bookArray = [];
      for (let k = 0; k < shelf_row; k++) {
        const shelfRow = document.createElement("div");
        shelfRow.className = "shelf-row";
        const shelfRow_array = [];

        for (let j = 0; j < shelf_col; j++) {
          const shelfCell = document.createElement("div");
          shelfCell.className = "shelf-cell";
          const shelfCell_array = [];

          if (shelf_nest != null && shelf_nest[k]) {
            shelfCell.dataset.cell = `${k + 1}-1`;
            j = shelf_col - 1;
          } else {
            shelfCell.dataset.cell = `${k + 1}-${j + 1}`;
          }
          shelfRow.appendChild(shelfCell);
          shelfRow_array.push(shelfCell_array);
        }

        shelf_area.appendChild(shelfRow);
        shelf_bookArray.push(shelfRow_array);
      }
    } else {
      document.querySelector("#shelf_lists").innerHTML += `<div>${shelfData[i].name}</div>`;
    }
  }

  // filter book
  for (let book of dataArray) {
    const book_locate = book.Locate.split(" ").slice(0, -1).join(" ");
    const book_order = book.Locate.split(" ").slice(-1)[0];
    if (book_locate == shelf_name) {
      shelf_bookArray[Number(book_order.split("-")[0]) - 1][Number(book_order.split("-")[1]) - 1].push(book);
    }
  }

  // add book
  shelf_bookArray.forEach((row, i) => {
    row.forEach((cell, j) => {
      cell.sort(
        (a, b) =>
          a.Locate.split(" ").slice(-1)[0].split("-")[2] - b.Locate.split(" ").slice(-1)[0].split("-")[2]
      );

      var k = 1;
      cell.forEach((book) => {
        const shelfDOM = document.querySelector(`#shelf_area div[data-cell="${i + 1}-${j + 1}"]`);
        var book = `<div class="book" data-cell="${i + 1}-${j + 1}-${k}"></div>`;
        shelfDOM.innerHTML += book;
        k++;
      });
    });
  });
  color_bookshelf();

  // generate chart
  generate_chart();

  const books = document.querySelectorAll("#shelf_area .book");
  books.forEach((book) => {
    book.addEventListener("click", (e) => search_book_shelf(e));

    let touchstartTimestamp = 0;
    book.addEventListener("touchstart", (e) => {
      if (touchstartTimestamp === 0) {
        touchstartTimestamp = Date.now();

        setTimeout(() => {
          touchstartTimestamp = 0;
        }, 300);
      } else {
        const timeDifference = Date.now() - touchstartTimestamp;
        if (timeDifference < 300) {
          search_book_shelf(e, false);
          touchstartTimestamp = 0;
        }
      }
    });
  });

  // book detail
  document.addEventListener("mousemove", (e) => {
    const shelf_detail = document.querySelector("#shelf_detail");

    const isInsideShelfCell = (e) => {
      let isInside = false;

      document.querySelectorAll(".shelf-cell").forEach((cell) => {
        const rect = cell.getBoundingClientRect();
        // Check if the e.clientX and e.clientY are within the cell's boundaries
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          isInside = true;
        }
      });

      return isInside;
    };

    if (isInsideShelfCell(e)) {
      if (e.target.className.includes("book")) {
        const book_data = e.target.dataset.cell.split("-");
        const book_current = shelf_bookArray[book_data[0] - 1][book_data[1] - 1][book_data[2] - 1];

        bookDetail_bookshelf(-1, e.clientX, e.clientY);
        document.querySelector("#shelf_detail_bookCover > img").src = book_current.Img;
        const shelf_detail_name = document.querySelector("#shelf_detail_name");
        const shelf_detail_author = document.querySelector("#shelf_detail_author");
        shelf_detail_name.textContent = book_current.Name;
        shelf_detail_author.textContent = book_current.Author;
      } else {
        if (document.querySelector("#shelf_detail_name").textContent.trim() == "") return;
        bookDetail_bookshelf(-1, e.clientX, e.clientY);
      }
    } else {
      if (current_bookNumber != null) {
        const highlight_book = document.querySelector(`#shelf_area .book.selected`);
        if (highlight_book == null) return;
        const bookBox = highlight_book.getBoundingClientRect();
        const bookBox_x = bookBox.x;
        const bookBox_y = bookBox.y + bookBox.height / 2;
        bookDetail_bookshelf(current_bookNumber, bookBox_x, bookBox_y);
        return;
      } else {
        shelf_detail.style.display = "none";
      }
      if (e.target.parentNode.className != "shelf-row") {
        shelf_detail.style.display = "none";
        document.querySelector("#shelf_detail_name").textContent = "";
      }
    }
  });

  // resize shelf
  var shelf_width = 0;
  document.querySelectorAll(".shelf-row").forEach((row) => {
    if (row.childElementCount != 1 || shelf_nest == null) {
      row.querySelectorAll(".shelf-cell").forEach((cell) => {
        if (cell.offsetWidth > shelf_width) shelf_width = cell.offsetWidth;
      });
    }
  });

  document.querySelectorAll(".shelf-cell").forEach((cell) => {
    cell.style.width = `${shelf_width - 20}px`;
  });
  document.querySelectorAll(".shelf-row").forEach((row) => {
    if (row.childElementCount != 1) return;
    var col = row.children[0];
    var prev = row.previousSibling;
    var next = row.nextSibling;
    if (prev != null) {
      col.style.width = `${prev.offsetWidth - 18}px`;
    } else {
      if (next == null) return;
      col.style.width = `${next.offsetWidth - 18}px`;
    }
  });
  document.querySelectorAll(".shelf-row").forEach((row) => {
    if (row.offsetWidth > window.innerWidth) {
      shelf_area.style.alignItems = "baseline";
      return;
    }
    shelf_area.style.alignItems = "center";
  });

  // add event to shelf lists
  document.querySelectorAll("#shelf_lists > *").forEach((list) =>
    list.addEventListener("click", () => {
      current_bookShelf = list.textContent;
      generate_bookshelf(list.textContent);
      shelf_list.style.display = "none";
    })
  );

  // add event to shelf colored lists
  document.querySelectorAll("#shelfColor_lists > *").forEach((list) =>
    list.addEventListener("click", () => {
      shelf_highlight = list.textContent.toLowerCase();
      color_bookshelf();
      generate_chart();
      shelfColor_list.style.display = "none";
      document.querySelectorAll("#shelfColor_lists > *").forEach((el) => (el.className = ""));
      list.className = "selected";
    })
  );

  // shelf overlay
  document.addEventListener("mousemove", (e) => {
    if (current_page != "shelf") return;
    document.querySelectorAll("#shelf_area .shelf_overlay").forEach((el) => el.remove());
    const hover_cell = e.target;
    if (hover_cell.className == "shelf-cell" || hover_cell.className.includes("book")) {
      if (
        !hover_cell.className.includes("book") &&
        hover_cell.childElementCount > 0 &&
        hover_cell.children[0].className == "shelf_overlay"
      )
        return;

      const shelf_overlay = document.createElement("div");
      const shelf_overlay_text = document.createElement("div");
      shelf_overlay.className = "shelf_overlay";
      shelf_overlay.appendChild(shelf_overlay_text);

      if (hover_cell.className.includes("book")) {
        shelf_overlay_text.textContent = hover_cell.dataset.cell.split("-").slice(0, -1).join("-");
        hover_cell.parentNode.appendChild(shelf_overlay);
      } else {
        hover_cell.appendChild(shelf_overlay);
        shelf_overlay_text.textContent = hover_cell.dataset.cell;
      }
    }
  });

  // vertical scroll
  shelf_area.addEventListener("wheel", (e) => {
    const speed = 0.2;
    shelf_area.scroll({
      left: shelf_area.scrollLeft + e.deltaY * speed,
    });
  });
};

// colorized book
var shelf_highlight = "none";
const color_bookshelf = () => {
  const books = document.querySelectorAll(".book");
  books.forEach((book) => {
    const book_data = book.dataset.cell.split("-");
    const book_current = shelf_bookArray[book_data[0] - 1][book_data[1] - 1][book_data[2] - 1];

    for (let book_index in dataArray_filter) {
      if (dataArray_filter[book_index].Name == book_current.Name) {
        const eachBook = dataArray_filter[book_index];

        var class_modifier = "";
        switch (shelf_highlight) {
          case "reading":
            if (eachBook.Status == "read") class_modifier = "";
            else if (eachBook.Status == "reading") class_modifier = " brown";
            else if (eachBook.Status == "unread") class_modifier = " red";
            break;
          case "cover":
            if (eachBook.Cover == "yes") class_modifier = "";
            else if (eachBook.Cover == "seal") class_modifier = " brown";
            else if (eachBook.Cover == "no") class_modifier = " red";
            break;
          case "bag":
            if (eachBook.Bag == "yes") class_modifier = "";
            else if (eachBook.Bag == "seal") class_modifier = " brown";
            else if (eachBook.Bag == "no") class_modifier = " red";
            break;
          case "category":
            if (eachBook.Category == "การเงิน การลงทุน") class_modifier = " investment";
            else if (eachBook.Category == "เศรษฐศาสตร์") class_modifier = " economics";
            else if (eachBook.Category == "การตกแต่งภาพ") class_modifier = " image-editing";
            else if (eachBook.Category == "การออกแบบ") class_modifier = " design";
            else if (eachBook.Category == "คอมพิวเตอร์") class_modifier = " computer";
            else if (eachBook.Category == "ถ่ายภาพ") class_modifier = " photograph";
            else if (eachBook.Category == "หนังสือภาพ") class_modifier = " photo-book";
            else if (eachBook.Category == "สุขภาพ") class_modifier = " health";
            else if (eachBook.Category == "การแพทย์") class_modifier = " medical";
            else if (eachBook.Category == "การพัฒนาตนเอง") class_modifier = " self-development";
            else if (eachBook.Category == "จิตวิทยา") class_modifier = " psychology";
            else if (eachBook.Category == "ท่องเที่ยว") class_modifier = " travel";
            else if (eachBook.Category == "บันทึกการเดินทาง") class_modifier = " pocket";
            else if (eachBook.Category == "ประสบการณ์ชีวิต") class_modifier = " experience";
            else if (eachBook.Category == "นวนิยาย") class_modifier = " novel";
            else if (eachBook.Category == "วรรณคดี") class_modifier = " literature-1";
            else if (eachBook.Category == "วรรณกรรม") class_modifier = " literature-2";
            else if (eachBook.Category == "การเมือง การปกครอง") class_modifier = " politics";
            else if (eachBook.Category == "ธรรมะ ศาสนา และปรัชญา") class_modifier = " religion";
            else if (eachBook.Category == "ประวัติศาสตร์") class_modifier = " history";
            else if (eachBook.Category == "ภาษาศาสตร์") class_modifier = " linguistics";
            else if (eachBook.Category == "วิทยาศาสตร์") class_modifier = " science";
            else if (eachBook.Category == "สังคมศาสตร์") class_modifier = " social-science";
            else if (eachBook.Category == "การ์ตูน") class_modifier = " cartoon";
            else if (eachBook.Category == "การแต่งกาย") class_modifier = " dressing";
            else if (eachBook.Category == "การทำอาหาร") class_modifier = " cooking";
            break;
          default:
        }
        book.className = book.className.includes("selected") ? "book selected" : "book";
        book.className += class_modifier;
      }
    }
  });
};

// convert search book shelf -> search book
const search_book_shelf = (e, isMouse = true) => {
  if (isMouse != (e.pointerType == "mouse")) return;

  const book_data = e.currentTarget.dataset.cell.split("-");
  const book_current = shelf_bookArray[book_data[0] - 1][book_data[1] - 1][book_data[2] - 1];

  for (let book_index in dataArray_filter) {
    if (dataArray_filter[book_index].Name == book_current.Name) {
      search_book(book_index);
      break;
    }
  }
};

// highlight book
const highlight_bookshelf = (bookNumber) => {
  if (bookNumber == null) return;
  current_bookNumber = bookNumber;
  const highlight_locate = dataArray_filter[bookNumber].Locate;
  if (highlight_locate.toLowerCase() == "box" || highlight_locate == "")
    generate_bookshelf(current_bookShelf);
  else {
    document.querySelectorAll("#shelf_area .book.selected").forEach((el) => (el.className = "book"));
    generate_bookshelf(highlight_locate.split(" ").slice(0, -1).join(" "));
    const highlight_cell = highlight_locate.split(" ").slice(-1)[0];
    const highlight_book = document.querySelector(`#shelf_area div[data-cell="${highlight_cell}"]`);
    highlight_book.className = "book selected";
    highlight_book.scrollIntoView();

    // show book detail
    const bookBox = highlight_book.getBoundingClientRect();
    const bookBox_x = bookBox.x;
    const bookBox_y = bookBox.y + bookBox.height / 2;
    bookDetail_bookshelf(bookNumber, bookBox_x, bookBox_y);
  }
};

// book detail
const bookDetail_bookshelf = (bookNumber, X, Y) => {
  // update book detail
  if (bookNumber >= 0) {
    document.querySelector("#shelf_detail_bookCover > img").src = dataArray_filter[bookNumber].Img;
    const shelf_detail_name = document.querySelector("#shelf_detail_name");
    const shelf_detail_author = document.querySelector("#shelf_detail_author");
    shelf_detail_name.textContent = dataArray_filter[bookNumber].Name;
    shelf_detail_author.textContent = dataArray_filter[bookNumber].Author;
  }

  // show book detail
  const shelf_detail = document.querySelector("#shelf_detail");
  shelf_detail.style.display = "flex";

  // check if over left - right
  if (X - 130 < 0) {
    // arrow left
    shelf_detail.style.top = `${Y - 60}px`;
    shelf_detail.style.left = `${X + 30}px`;
    shelf_detail.className = "left";
  } else if (X + 130 > window.innerWidth) {
    // arrow right
    shelf_detail.className = "right";
    shelf_detail.style.top = `${Y - 60}px`;
    shelf_detail.style.left = `${X - 250}px`;
  } else {
    // arrow up
    shelf_detail.style.top = `${Y + 40}px`;
    shelf_detail.style.left = `${X - 105}px`;
    shelf_detail.className = "up";
  }
};

// generate chart
var generatedChart;
const generate_chart = () => {
  if (shelf_highlight == "none") return;
  const ctx = document.querySelector("#shelfChart_canvas");

  // TODO: add color to category
  const labels = [
    { tag: "Reading", labels: ["Read", "Reading", "Unread"], colors: ["#555479", "#ded2b8", "#ef4b4c"] },
    { tag: "Cover", labels: ["Yes", "Seal", "No"], colors: ["#555479", "#ded2b8", "#ef4b4c"] },
    { tag: "Bag", labels: ["Yes", "Seal", "No"], colors: ["#555479", "#ded2b8", "#ef4b4c"] },
    {
      tag: "Category",
      labels: [
        "ประสบการณ์ชีวิต",
        "วรรณกรรม",
        "บันทึกการเดินทาง",
        "ถ่ายภาพ",
        "วิทยาศาสตร์",
        "ประวัติศาสตร์",
        "คอมพิวเตอร์",
        "เศรษฐศาสตร์",
        "ท่องเที่ยว",
        "ภาษาศาสตร์",
        "จิตวิทยา",
        "การเงิน การลงทุน",
        "การทำอาหาร",
        "การแพทย์",
        "นวนิยาย",
        "การ์ตูน",
        "หนังสือภาพ",
        "การตกแต่งภาพ",
        "สังคมศาสตร์",
        "การพัฒนาตนเอง",
        "สุขภาพ",
        "การออกแบบ",
        "ธรรมะ ศาสนา และปรัชญา",
        "การแต่งกาย",
        "การเมือง การปกครอง",
        "วรรณคดี",
      ],
      colors: [
        "#f06f6f",
        "#df77cc",
        "#f56a6a",
        "#76c466",
        "#3d619b",
        "#384863",
        "#88c67c",
        "#fac19e",
        "#c06060",
        "#214989",
        "#599cab",
        "#f7a877",
        "#a5a376",
        "#af77df",
        "",
        "#e9e9e8",
        "#83a77c",
        "#88c67c",
        "",
        "#3d8a9b",
        "#af77df",
        "#99f188",
        "#3d619b",
        "#6b89b9",
        "#888888",
      ],
    },
  ];

  // generate label and counts
  var label = [];
  var counts;
  var colors = [];
  for (let el of labels) {
    if (el.tag.toLowerCase() == shelf_highlight) {
      label = [...el.labels];
      counts = Array.from({ length: label.length }, () => 0);
      colors = [...el.colors];
      break;
    }
  }

  for (let book of dataArray_filter) {
    label.forEach((el, i) => {
      if (
        (shelf_highlight == "reading" && book.Status == el.toLowerCase()) ||
        (shelf_highlight == "cover" && book.Cover == el.toLowerCase()) ||
        (shelf_highlight == "bag" && book.Bag == el.toLowerCase()) ||
        (shelf_highlight == "category" && book.Category == el.toLowerCase())
      ) {
        counts[i]++;
        return;
      }
    });
  }

  const data = {
    labels: label,
    datasets: [
      {
        data: counts,
        backgroundColor: colors,
      },
    ],
  };

  if (generatedChart != undefined) generatedChart.destroy();
  generatedChart = new Chart(ctx, {
    type: "pie",
    data: data,
  });
};

// #endregion

// #region : page - book

const search_book = (book_number) => {
  document.querySelector("#searchBar").style.display = "none";
  current_bookNumber = book_number;
  generate_book(book_number);
  page_change("book");
};

const book_author = document.querySelector("#book > #book_detail > #book_author");
const book_star = document.querySelector("#book > #book_detail > #book_star > span");
const generate_book = (book_number) => {
  const book = document.querySelector("#book");

  const book_image = document.querySelector("#book > #book_imageContainer > #book_image > img");
  const book_name = document.querySelector("#book > #book_detail > #book_name");
  const book_descript = document.querySelector("#book > #book_detail > #book_descript");
  const book_tags = document.querySelector("#book > #book_detail > #book_tags");

  if (dataArray_filter[book_number] == undefined) return;

  // update author
  const book_authorArray = dataArray_filter[book_number].Author.split(",").map((item) => item.trim());
  book_author.innerHTML = "";
  for (let i = 0; i < book_authorArray.length; i++) {
    book_author.innerHTML += `<div onclick="book_searchNear_author('${book_authorArray[i]}')">${book_authorArray[i]}</div>`;
    if (i != book_authorArray.length - 1) book_author.innerHTML += ", ";
  }

  book_image.src = dataArray_filter[book_number].Img;
  book_name.textContent = dataArray_filter[book_number].Name;
  book_star.textContent = `${Number(dataArray_filter[book_number].Star).toFixed(1)} / 5.0`;
  book_descript.innerHTML = dataArray_filter[book_number].Description.replace(/<br\s*\/?>/g, "\n");
  book_tags.innerHTML = `<div onclick="book_searchNear_category('${
    dataArray_filter[book_number].Category
  }')">${dataArray_filter[book_number].Category}</div>
     <div onclick="book_searchNear_status('${dataArray_filter[book_number].Status}')">${
    dataArray_filter[book_number].Status.charAt(0).toUpperCase() +
    dataArray_filter[book_number].Status.slice(1)
  }</div>
  <div onclick="book_searchNear_cover('${dataArray_filter[book_number].Cover}')">${
    dataArray_filter[book_number].Cover.charAt(0).toUpperCase() +
    dataArray_filter[book_number].Cover.slice(1)
  }</div>`;
};

// search nearest book
var book_searchNear_index = 0;
var book_searchNear_previous = null;
var book_searchNear_array = [];
const book_searchNear_author = (value) => {
  // update search type
  if (value.trim() != book_searchNear_previous) {
    book_searchNear_previous = value.trim();
    book_searchNear_array = [];
    book_searchNear_index = 0;
  }

  // generate search array
  for (let i = 0; i < dataArray_filter.length; i++) {
    if (dataArray_filter[i].Author.includes(value.trim())) {
      book_searchNear_array.push(i);
    }
  }

  // loop through search array
  book_searchNear_index =
    book_searchNear_index < book_searchNear_array.length - 1 ? book_searchNear_index + 1 : 0;
  generate_book(book_searchNear_array[book_searchNear_index]);
  current_bookNumber = book_searchNear_array[book_searchNear_index];
};
const book_searchNear_category = (value) => {
  // update search type
  if (value.trim() != book_searchNear_previous) {
    book_searchNear_previous = value.trim();
    book_searchNear_array = [];
    book_searchNear_index = 0;
  }

  // generate search array
  for (let i = 0; i < dataArray_filter.length; i++) {
    if (dataArray_filter[i].Category.includes(value.trim())) {
      book_searchNear_array.push(i);
    }
  }

  // loop through search array
  book_searchNear_index =
    book_searchNear_index < book_searchNear_array.length - 1 ? book_searchNear_index + 1 : 0;
  generate_book(book_searchNear_array[book_searchNear_index]);
  current_bookNumber = book_searchNear_array[book_searchNear_index];
};
const book_searchNear_status = (value) => {
  // update search type
  if (value.trim() != book_searchNear_previous) {
    book_searchNear_previous = value.trim();
    book_searchNear_array = [];
    book_searchNear_index = 0;
  }

  // generate search array
  for (let i = 0; i < dataArray_filter.length; i++) {
    if (dataArray_filter[i].Status.includes(value.trim())) {
      book_searchNear_array.push(i);
    }
  }

  // loop through search array
  book_searchNear_index =
    book_searchNear_index < book_searchNear_array.length - 1 ? book_searchNear_index + 1 : 0;
  generate_book(book_searchNear_array[book_searchNear_index]);
  current_bookNumber = book_searchNear_array[book_searchNear_index];
};
const book_searchNear_cover = (value) => {
  // update search type
  if (value.trim() != book_searchNear_previous) {
    book_searchNear_previous = value.trim();
    book_searchNear_array = [];
    book_searchNear_index = 0;
  }

  // generate search array
  for (let i = 0; i < dataArray_filter.length; i++) {
    if (dataArray_filter[i].Cover.includes(value.trim())) {
      book_searchNear_array.push(i);
    }
  }

  // loop through search array
  book_searchNear_index =
    book_searchNear_index < book_searchNear_array.length - 1 ? book_searchNear_index + 1 : 0;
  generate_book(book_searchNear_array[book_searchNear_index]);
  current_bookNumber = book_searchNear_array[book_searchNear_index];
};

// #endregion

// #region : page - gallery

var gallery_bookCount = 0;
const generate_bookgallery = () => {
  if (!isDataloaded) return;
  const gallery = document.querySelector("#gallery");

  const gallery_row = Math.ceil(gallery.offsetHeight / 185);
  const gallery_col = Math.floor(gallery.offsetWidth / 150);

  for (gallery_bookCount; gallery_bookCount < (gallery_row + 1) * gallery_col; gallery_bookCount++) {
    if (dataArray_filter[gallery_bookCount] == null) break;
    gallery.innerHTML += `<div class="gallery_book" onclick="search_book(${gallery_bookCount})"><img data-src="${dataArray_filter[gallery_bookCount].Img}" class="lazy-img"></div>`;
  }
  lazy_image();

  gallery.addEventListener("scroll", () => {
    if (gallery_bookCount == dataArray_filter.length) return;
    const last_book = document.querySelector("#gallery > .gallery_book:last-child").getBoundingClientRect();

    if (last_book.y <= window.innerHeight - 70) {
      const new_bookCount = gallery_bookCount + gallery_col;
      for (gallery_bookCount; gallery_bookCount <= new_bookCount; gallery_bookCount++) {
        if (dataArray_filter[gallery_bookCount] == null) break;
        gallery.innerHTML += `<div class="gallery_book" onclick="search_book(${gallery_bookCount})"><img data-src="${dataArray_filter[gallery_bookCount].Img}" class="lazy-img"></div>`;
      }
      lazy_image();
    }

    // scroll top btn
    const btn_scrollTop = document.querySelector("#btn_scrollTop");
    if (gallery.scrollTop > 50) {
      btn_scrollTop.style.display = "flex";
    } else {
      btn_scrollTop.style.display = "none";
    }
    btn_scrollTop.addEventListener("click", () => {
      gallery.scrollTop = 0;
    });
  });
};

// #endregion

// #region : page - edit

// #endregion

// .shelf_book.novel {
//   background-color: #c773b8;
// }

// .shelf_book.literature-1 {
//   background-color: #ca8abf;
// }

// .shelf_book.literature-2 {
//   background-color: #df77cc;
// }

// .shelf_book.social-science {
//   background-color: #243b60;
// }
// .shelf_book.dressing {
//   background-color: #888888;
// }
